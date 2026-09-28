import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'

const brMoney=(v:unknown)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const phoneForWa=(raw:unknown)=>{let d=String(raw||'').replace(/\D/g,'');if(!d)return '';if((d.length===10||d.length===11)&&!d.startsWith('55'))d='55'+d;return d}

export async function GET(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),workOrderId=new URL(req.url).searchParams.get('workOrderId')||''
  if(!workOrderId)return NextResponse.json({error:'OS obrigatória'},{status:400})
  const rows=await sql`select id,status,amount,due_date,public_token from financial_entries where company_id=${companyId} and work_order_id=${workOrderId} and entry_type='receivable' limit 1`
  if(!rows.length)return NextResponse.json({exists:false,status:'none',amount:0})
  const x:any=rows[0]
  return NextResponse.json({exists:true,status:String(x.status||'pending'),amount:Number(x.amount||0),dueDate:x.due_date||null,hasLink:!!x.public_token})
 }catch{return NextResponse.json({error:'Erro ao consultar cobrança'},{status:500})}
}

export async function POST(req:Request){
 try{
  const companyId=await ensureDb(),sql=getDb(),b=await req.json(),workOrderId=String(b.workOrderId||'')
  if(!workOrderId)return NextResponse.json({error:'OS obrigatória'},{status:400})
  let rows=await sql`select f.id,f.status,f.amount,f.due_date,f.public_token,w.code,w.title,c.name client,c.phone,c.whatsapp,co.name company_name from financial_entries f join work_orders w on w.id=f.work_order_id and w.company_id=f.company_id left join clients c on c.id=w.client_id and c.company_id=w.company_id join companies co on co.id=w.company_id where f.company_id=${companyId} and f.work_order_id=${workOrderId} and f.entry_type='receivable' limit 1`
  if(!rows.length){
   const w=await sql`select w.id,w.code,w.title,w.total,w.due_date,w.stage,c.name client,c.phone,c.whatsapp,co.name company_name from work_orders w left join clients c on c.id=w.client_id and c.company_id=w.company_id join companies co on co.id=w.company_id where w.id=${workOrderId} and w.company_id=${companyId} limit 1`
   if(!w.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
   if(!['Aprovado','Produção','Concluído'].includes(String(w[0].stage)))return NextResponse.json({error:'A cobrança é criada quando a OS é aprovada.'},{status:409})
   await sql`insert into financial_entries(company_id,work_order_id,entry_type,description,amount,due_date,status,public_token) values(${companyId},${workOrderId},'receivable',${'Cobrança '+w[0].code+' — '+w[0].title},${w[0].total},${w[0].due_date},'pending',gen_random_uuid()) on conflict(work_order_id,entry_type) where work_order_id is not null and entry_type='receivable' do nothing`
   rows=await sql`select f.id,f.status,f.amount,f.due_date,f.public_token,w.code,w.title,c.name client,c.phone,c.whatsapp,co.name company_name from financial_entries f join work_orders w on w.id=f.work_order_id and w.company_id=f.company_id left join clients c on c.id=w.client_id and c.company_id=w.company_id join companies co on co.id=w.company_id where f.company_id=${companyId} and f.work_order_id=${workOrderId} and f.entry_type='receivable' limit 1`
  }
  let x:any=rows[0]
  if(!x.public_token){
   const updated=await sql`update financial_entries set public_token=gen_random_uuid() where id=${x.id} and company_id=${companyId} returning public_token`
   x={...x,public_token:updated[0]?.public_token}
  }
  if(x.status!=='paid')await sql`update financial_entries set charge_sent_at=now() where id=${x.id} and company_id=${companyId}`
  const origin=new URL(req.url).origin,url=origin+'/cobranca/'+x.public_token
  const due=x.due_date?new Date(String(x.due_date)+'T12:00:00').toLocaleDateString('pt-BR'):'a combinar'
  const msg=`Olá, ${x.client||''}! Segue a cobrança referente à ${x.code} — ${x.title}. Valor: ${brMoney(x.amount)}. Vencimento: ${due}. Acompanhe por aqui: ${url}`
  const phone=phoneForWa(x.whatsapp||x.phone)
  return NextResponse.json({url,waUrl:phone?'https://wa.me/'+phone+'?text='+encodeURIComponent(msg):'https://wa.me/?text='+encodeURIComponent(msg),status:x.status,amount:Number(x.amount)})
 }catch{return NextResponse.json({error:'Erro ao gerar cobrança'},{status:500})}
}
