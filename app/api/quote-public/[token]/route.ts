import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'

export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){
 try{
  await ensureDb()
  const {token}=await params,sql=getDb(),form=await req.formData(),approvedName=String(form.get('approvedName')||'').trim()
  if(approvedName.length<2)return NextResponse.json({error:'Informe o nome de quem está aprovando o orçamento.'},{status:400})
  const rows=await sql`update work_orders set public_approved_at=coalesce(public_approved_at,now()),public_approved_name=coalesce(public_approved_name,${approvedName}),approved_at=coalesce(approved_at,now()),stage='Aprovado' where public_token::text=${token} and (public_token_expires_at is null or public_token_expires_at>now()) and stage in ('Atendimento','Orçamento') and public_approved_at is null returning id,company_id,code,title,total,due_date`
  if(!rows.length)return NextResponse.json({error:'Orçamento não encontrado, expirado ou já aprovado.'},{status:404})
  const w=rows[0]
  await sql`insert into financial_entries(company_id,work_order_id,entry_type,description,amount,due_date,status,public_token) values(${w.company_id},${w.id},'receivable',${'Cobrança '+w.code+' — '+w.title},${w.total},${w.due_date},'pending',gen_random_uuid()) on conflict(work_order_id,entry_type) where work_order_id is not null and entry_type='receivable' do update set amount=excluded.amount,due_date=excluded.due_date,description=excluded.description,public_token=coalesce(financial_entries.public_token,gen_random_uuid())`
  await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${w.company_id},${w.id},'approval','Orçamento aprovado pelo cliente',${'Aprovado por '+approvedName})`
  return NextResponse.redirect(new URL('/orcamento/'+token,req.url),303)
 }catch{return NextResponse.json({error:'Erro ao aprovar orçamento'},{status:500})}
}
