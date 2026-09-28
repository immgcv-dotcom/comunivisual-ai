import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
const tag=(xml:string,name:string)=>{const m=xml.match(new RegExp('<(?:\\w+:)?'+name+'[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?'+name+'>','i'));return m?m[1].replace(/<!\[CDATA\[|\]\]>/g,'').trim():''}
const blocks=(xml:string,name:string)=>[...xml.matchAll(new RegExp('<(?:\\w+:)?'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?'+name+'>','gi'))].map(m=>m[1])
const paymentName=(code:string)=>({ '01':'Dinheiro','02':'Cheque','03':'Cartão de crédito','04':'Cartão de débito','15':'Boleto','16':'Transferência bancária','17':'Pix','18':'Transferência bancária' } as Record<string,string>)[code]||'Não informado'
const validMethods=['Pix','Boleto','Dinheiro','Cartão de débito','Cartão de crédito','Transferência bancária','Cheque','Outro','Não informado']

export async function GET(){try{const companyId=await ensureDb(),sql=getDb();const rows=await sql`select i.*,count(ii.id)::int item_count from stock_invoices i left join stock_invoice_items ii on ii.invoice_id=i.id where i.company_id=${companyId} group by i.id order by i.created_at desc limit 50`;return NextResponse.json(rows)}catch{return NextResponse.json({error:'Erro ao carregar notas'},{status:500})}}

export async function POST(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),b=await req.json(),xml=String(b.xml||'')
  if(!xml.includes('<'))return NextResponse.json({error:'Cole o XML completo da NF-e.'},{status:400})
  const inf=blocks(xml,'infNFe')[0]||xml,ide=blocks(inf,'ide')[0]||'',emit=blocks(inf,'emit')[0]||'',totalBlock=blocks(inf,'ICMSTot')[0]||'',cobr=blocks(inf,'cobr')[0]||'',dup=blocks(cobr,'dup')[0]||'',pag=blocks(inf,'pag')[0]||'',detPag=blocks(pag,'detPag')[0]||''
  const rawId=(inf.match(/Id=["']NFe(\d{44})["']/i)||[])[1]||tag(inf,'chNFe'),key=rawId.replace(/\D/g,'')||null,number=tag(ide,'nNF'),series=tag(ide,'serie'),supplierDocument=(tag(emit,'CNPJ')||tag(emit,'CPF')).replace(/\D/g,''),supplierName=tag(emit,'xNome'),issued=tag(ide,'dhEmi')||tag(ide,'dEmi')
  const dets=blocks(inf,'det');if(!dets.length)return NextResponse.json({error:'Nenhum produto encontrado no XML.'},{status:400})
  const itemFallback=dets.reduce((sum,d)=>{const prod=blocks(d,'prod')[0]||d;return sum+(Number(tag(prod,'qCom')||0)*Number(tag(prod,'vUnCom')||0))},0)
  const xmlTotal=Number(tag(totalBlock,'vNF')||0),total=Number.isFinite(xmlTotal)&&xmlTotal>0?xmlTotal:itemFallback
  if(key&&key.length!==44)return NextResponse.json({error:'Chave de acesso da NF-e inválida.'},{status:400})
  if(issued&&Number.isNaN(new Date(issued).getTime()))return NextResponse.json({error:'Data de emissão da NF-e inválida.'},{status:400})
  if(key){const dupRow=await sql`select id from stock_invoices where company_id=${companyId} and access_key=${key} limit 1`;if(dupRow.length)return NextResponse.json({error:'Esta NF-e já foi importada.'},{status:409})}
  const requestedMethod=String(b.paymentMethod||'auto'),inferred=paymentName(tag(detPag,'tPag')),paymentMethod=requestedMethod==='auto'?inferred:requestedMethod
  if(!validMethods.includes(paymentMethod))return NextResponse.json({error:'Método de pagamento inválido.'},{status:400})
  const paymentStatus=b.paymentStatus==='paid'?'paid':'pending'
  const xmlDue=tag(dup,'dVenc'),paymentDueDate=String(b.paymentDueDate||xmlDue||'')||null
  if(paymentDueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(paymentDueDate))return NextResponse.json({error:'Data de vencimento inválida.'},{status:400})
  const invoice=await sql`insert into stock_invoices(company_id,access_key,number,series,supplier_name,supplier_document,issued_at,total) values(${companyId},${key},${number||null},${series||null},${supplierName||null},${supplierDocument||null},${issued?new Date(issued).toISOString():null},${Number.isFinite(total)?total:0}) returning *`
  const imported=[]
  for(const d of dets){
   const prod=blocks(d,'prod')[0]||d,code=tag(prod,'cProd'),description=tag(prod,'xProd')||'Item NF-e',unit=tag(prod,'uCom')||'un',qty=Number(tag(prod,'qCom')||0),unitCost=Number(tag(prod,'vUnCom')||0),ncm=tag(prod,'NCM'),cfop=tag(prod,'CFOP')
   let materialId:string|null=null
   if(supplierDocument&&code){const map=await sql`select material_id from supplier_material_mappings where company_id=${companyId} and supplier_document=${supplierDocument} and supplier_code=${code} limit 1`;materialId=map[0]?.material_id||null}
   const rows=await sql`insert into stock_invoice_items(invoice_id,supplier_code,description,ncm,cfop,unit,quantity,unit_cost,material_id) values(${invoice[0].id},${code||null},${description},${ncm||null},${cfop||null},${unit},${Number.isFinite(qty)?qty:0},${Number.isFinite(unitCost)?unitCost:0},${materialId}) returning *`
   if(materialId&&Number.isFinite(qty)&&qty>0&&Number.isFinite(unitCost)&&unitCost>=0){
    await sql`update materials set stock_quantity=stock_quantity+${qty},unit_cost=case when stock_quantity+${qty}>0 then ((stock_quantity*unit_cost)+(${qty}*${unitCost}))/(stock_quantity+${qty}) else ${unitCost} end where id=${materialId} and company_id=${companyId}`
    await sql`update stock_invoice_items set posted_at=now() where id=${rows[0].id}`
    await sql`insert into inventory_movements(company_id,material_id,movement_type,quantity,unit_cost) values(${companyId},${materialId},'invoice',${qty},${unitCost})`
    rows[0].posted_at=new Date().toISOString()
   }
   imported.push(rows[0])
  }
  let financialEntry=null
  if(Number.isFinite(total)&&total>0){
   const description='Compra NF '+(number||key?.slice(-8)||'')+(supplierName?' · '+supplierName:'')
   const entries=await sql`insert into financial_entries(company_id,entry_type,description,amount,due_date,status,paid_at,payment_method,source_type,source_id) values(${companyId},'payable',${description},${total},${paymentDueDate},${paymentStatus},case when ${paymentStatus}='paid' then now() else null end,${paymentMethod},'stock_invoice',${String(invoice[0].id)}) on conflict(company_id,source_type,source_id,entry_type) where source_id is not null do update set description=excluded.description,amount=excluded.amount,due_date=excluded.due_date,status=excluded.status,paid_at=excluded.paid_at,payment_method=excluded.payment_method returning *`
   financialEntry=entries[0]||null
  }
  return NextResponse.json({invoice:invoice[0],items:imported,financialEntry},{status:201})
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao importar NF-e'},{status:500})}
}

export async function PATCH(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),b=await req.json()
  if(!b.itemId)return NextResponse.json({error:'Item obrigatório'},{status:400})
  const item=await sql`select ii.*,i.supplier_document from stock_invoice_items ii join stock_invoices i on i.id=ii.invoice_id where ii.id=${b.itemId} and i.company_id=${companyId} limit 1`
  if(!item.length)return NextResponse.json({error:'Item não encontrado'},{status:404})
  let materialId=String(b.materialId||'')
  if(materialId){const m=await sql`select id from materials where id=${materialId} and company_id=${companyId}`;if(!m.length)return NextResponse.json({error:'Material inválido'},{status:400})}
  else{const rows=await sql`insert into materials(company_id,name,unit,stock_quantity,min_stock,unit_cost) values(${companyId},${item[0].description},${item[0].unit||'un'},0,0,${Number(item[0].unit_cost||0)}) on conflict(company_id,name) do update set unit_cost=excluded.unit_cost returning id`;materialId=String(rows[0].id)}
  if(item[0].posted_at)return NextResponse.json({error:'Item da nota já foi lançado no estoque.'},{status:409})
  const qty=Number(item[0].quantity||0),cost=Number(item[0].unit_cost||0)
  if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(cost)||cost<0)return NextResponse.json({error:'Quantidade ou custo inválido no item da NF-e.'},{status:400})
  await sql`update materials set stock_quantity=stock_quantity+${qty},unit_cost=case when stock_quantity+${qty}>0 then ((stock_quantity*unit_cost)+(${qty}*${cost}))/(stock_quantity+${qty}) else ${cost} end where id=${materialId} and company_id=${companyId}`
  await sql`update stock_invoice_items set material_id=${materialId},posted_at=now() where id=${b.itemId}`
  await sql`insert into inventory_movements(company_id,material_id,movement_type,quantity,unit_cost) values(${companyId},${materialId},'invoice',${qty},${cost})`
  if(item[0].supplier_document&&item[0].supplier_code)await sql`insert into supplier_material_mappings(company_id,supplier_document,supplier_code,material_id) values(${companyId},${item[0].supplier_document},${item[0].supplier_code},${materialId}) on conflict(company_id,supplier_document,supplier_code) do update set material_id=excluded.material_id`
  return NextResponse.json({ok:true,materialId})
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao lançar item no estoque'},{status:500})}
}
