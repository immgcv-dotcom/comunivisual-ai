import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'

const flow=['Orçamento','Aprovado','Produção','Concluído'] as const
const allowed=[...flow,'Cancelado']

export async function GET(){
 try{
  const companyId=await ensureDb(),sql=getDb()
  const rows=await sql`select w.id,w.code,w.title,w.stage,w.total,w.estimated_cost,w.actual_cost,w.production_hours,w.installation_hours,w.machine_hours,w.travel_km,w.quote_valid_until,w.payment_terms,w.quote_notes,w.discount,w.approved_at,w.due_date,w.created_at,c.name client, case when w.total>0 then round(((w.total-w.estimated_cost)/w.total)*100,2) else 0 end estimated_margin, coalesce(ps.minimum_margin_percent,0) minimum_margin, case when (1-(coalesce(ps.tax_percent,0)+coalesce(ps.commission_percent,0)+coalesce(ps.minimum_margin_percent,0))/100)>0 then round(greatest(w.estimated_cost-w.total*(coalesce(ps.tax_percent,0)+coalesce(ps.commission_percent,0))/100,0)/(1-(coalesce(ps.tax_percent,0)+coalesce(ps.commission_percent,0)+coalesce(ps.minimum_margin_percent,0))/100),2) else w.total end suggested_price from work_orders w left join clients c on c.id=w.client_id and c.company_id=w.company_id left join company_pricing_settings ps on ps.company_id=w.company_id where w.company_id=${companyId} order by w.created_at desc`
  return NextResponse.json(rows)
 }catch{return NextResponse.json({error:'Erro ao carregar serviços'},{status:500})}
}

export async function POST(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),body=await req.json()
  if(!body.title?.trim())return NextResponse.json({error:'Serviço é obrigatório'},{status:400})
  let clientId:string|undefined,clientName=''
  if(body.clientId){
   const found=await sql`select id,name from clients where id=${String(body.clientId)} and company_id=${companyId} limit 1`
   if(found.length){clientId=String(found[0].id);clientName=String(found[0].name)}
  }
  if(!clientId)return NextResponse.json({error:'Selecione um cliente válido'},{status:400})
  const seq=await sql`select coalesce(max(nullif(regexp_replace(code,'\\D','','g'),'')::int),1250)+1 n from work_orders where company_id=${companyId}`
  const code='OS-'+seq[0].n
  const totalRaw=body.total===''||body.total==null?0:Number(body.total)
  if(!Number.isFinite(totalRaw)||totalRaw<0)return NextResponse.json({error:'Valor estimado inválido'},{status:400})
  let due:string|null=null
  if(body.due){
   const d=String(body.due).trim(),m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
   if(!m)return NextResponse.json({error:'Data de entrega inválida'},{status:400})
   const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]),parsed=new Date(Date.UTC(y,mo-1,day))
   if(parsed.getUTCFullYear()!==y||parsed.getUTCMonth()!==mo-1||parsed.getUTCDate()!==day)return NextResponse.json({error:'Data de entrega inválida'},{status:400})
   due=d
  }
  const rows=await sql`insert into work_orders(company_id,client_id,code,title,stage,total,due_date) values(${companyId},${clientId},${code},${body.title.trim()},'Orçamento',${totalRaw},${due}) returning *`
  return NextResponse.json({...rows[0],client:clientName},{status:201})
 }catch{return NextResponse.json({error:'Erro ao criar OS'},{status:500})}
}

export async function PATCH(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),b=await req.json()
  if(!b.id)return NextResponse.json({error:'OS obrigatória'},{status:400})

  if(b.quoteDetails){
   const q=b.quoteDetails
   const owned=await sql`select id,stage from work_orders where id=${b.id} and company_id=${companyId} limit 1`
   if(!owned.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
   if(String(owned[0].stage)!=='Orçamento')return NextResponse.json({error:'O orçamento só pode ser alterado enquanto a OS estiver em Orçamento.'},{status:409})
   const sub=await sql`select coalesce(sum(i.quantity*i.unit_price),0) subtotal from work_order_items i join work_orders w on w.id=i.work_order_id where i.work_order_id=${b.id} and w.company_id=${companyId}`
   const subtotal=Number(sub[0]?.subtotal||0),discountRaw=Number(q.discount)
   if(!Number.isFinite(discountRaw)||discountRaw<0)return NextResponse.json({error:'Desconto inválido'},{status:400})
   const discount=Math.min(discountRaw,subtotal),total=Math.max(subtotal-discount,0)
   const rows=await sql`update work_orders set quote_valid_until=${q.validUntil||null},payment_terms=${String(q.paymentTerms||'')},quote_notes=${String(q.notes||'')},discount=${discount},total=${total} where id=${b.id} and company_id=${companyId} returning *`
   return NextResponse.json(rows[0]||null)
  }

  if(b.costInputs){
   const raw=[b.costInputs.productionHours,b.costInputs.installationHours,b.costInputs.machineHours,b.costInputs.travelKm].map(Number)
   if(raw.some(v=>!Number.isFinite(v)||v<0))return NextResponse.json({error:'Valores de custo inválidos.'},{status:400})
   const n=(v:unknown)=>Number(v)||0,ph=n(b.costInputs.productionHours),ih=n(b.costInputs.installationHours),mh=n(b.costInputs.machineHours),km=n(b.costInputs.travelKm)
   const stRows=await sql`select * from company_pricing_settings where company_id=${companyId}`,st=stRows[0]||{}
   const matRows=await sql`select coalesce(sum(wm.quantity*m.unit_cost),0) total from work_order_materials wm join materials m on m.id=wm.material_id and m.company_id=${companyId} where wm.work_order_id=${b.id}`
   const saleRows=await sql`select total from work_orders where id=${b.id} and company_id=${companyId}`
   if(!saleRows.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
   const material=Number(matRows[0].total||0),sale=Number(saleRows[0].total||0),waste=material*n(st.waste_percent)/100
   const operational=ph*n(st.production_hour_cost)+ih*n(st.installation_hour_cost)+mh*n(st.machine_hour_cost)+km*n(st.travel_km_cost)
   const variable=sale*(n(st.tax_percent)+n(st.commission_percent))/100,cost=material+waste+operational+variable
   const updated=await sql`update work_orders set production_hours=${ph},installation_hours=${ih},machine_hours=${mh},travel_km=${km},estimated_cost=${cost} where id=${b.id} and company_id=${companyId} returning *`
   return NextResponse.json(updated[0])
  }

  if(!allowed.includes(String(b.stage) as any))return NextResponse.json({error:'Etapa inválida'},{status:400})
  const currentRows=await sql`select * from work_orders where id=${b.id} and company_id=${companyId} limit 1`
  if(!currentRows.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
  const current=String(currentRows[0].stage),next=String(b.stage)
  if(current==='Cancelado'&&next!=='Cancelado')return NextResponse.json({error:'OS cancelada está arquivada.'},{status:409})
  if(current==='Concluído'&&next!=='Concluído')return NextResponse.json({error:'OS concluída não pode voltar de etapa.'},{status:409})
  if(current===next)return NextResponse.json(currentRows[0])
  if(next!=='Cancelado'){
   const ci=flow.indexOf(current as any),ni=flow.indexOf(next as any)
   if(ci<0||ni!==ci+1)return NextResponse.json({error:'Avance a OS uma etapa por vez.'},{status:409})
  }

  const rows=await sql`update work_orders set stage=${next},approved_at=case when ${next}='Aprovado' then coalesce(approved_at,now()) else approved_at end,installed_at=case when ${next}='Concluído' then coalesce(installed_at,now()) else installed_at end where id=${b.id} and company_id=${companyId} returning *`
  if(rows.length)await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${b.id},'stage','Etapa alterada',${current+' → '+next})`

  if(rows.length&&next==='Aprovado'){
   const w=rows[0]
   await sql`insert into financial_entries(company_id,work_order_id,entry_type,description,amount,due_date,status,public_token) values(${companyId},${w.id},'receivable',${'Cobrança '+w.code+' — '+w.title},${w.total},${w.due_date},'pending',gen_random_uuid()) on conflict (work_order_id,entry_type) where work_order_id is not null and entry_type='receivable' do update set amount=excluded.amount,due_date=excluded.due_date,description=excluded.description,public_token=coalesce(financial_entries.public_token,gen_random_uuid())`
  }

  if(rows.length&&next==='Concluído'){
   const reserved=await sql`select wm.material_id,wm.reserved_quantity,m.unit_cost from work_order_materials wm join materials m on m.id=wm.material_id and m.company_id=${companyId} where wm.work_order_id=${b.id} and wm.reserved_quantity>0`
   for(const m of reserved){const q=Number(m.reserved_quantity)||0;if(q>0){await sql`update work_order_materials set reserved_quantity=0 where work_order_id=${b.id} and material_id=${m.material_id}`;await sql`insert into inventory_movements(company_id,material_id,work_order_id,movement_type,quantity,unit_cost) values(${companyId},${m.material_id},${b.id},'consume',${q},${m.unit_cost})`}}
  }

  if(rows.length&&next==='Cancelado'){
   await sql`update financial_entries set status='cancelled' where company_id=${companyId} and work_order_id=${b.id} and entry_type='receivable' and status<>'paid'`
  }
  return NextResponse.json(rows[0]||null)
 }catch{return NextResponse.json({error:'Erro ao atualizar OS'},{status:500})}
}
