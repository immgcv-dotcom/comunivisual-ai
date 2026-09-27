import { NextRequest,NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),workOrderId=req.nextUrl.searchParams.get('workOrderId')
 if(!workOrderId)return NextResponse.json({error:'OS obrigatória'},{status:400})
 const rows=await sql`select e.* from work_order_events e join work_orders w on w.id=e.work_order_id where e.work_order_id=${workOrderId} and e.company_id=${companyId} and w.company_id=${companyId} order by e.created_at desc limit 100`
 return NextResponse.json(rows)}catch{return NextResponse.json({error:'Serviço temporariamente indisponível'},{status:503})}
}
export async function POST(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),body=await req.json(),workOrderId=String(body.workOrderId||''),title=String(body.title||'').trim(),detail=String(body.detail||'').trim()
 if(!workOrderId||!title)return NextResponse.json({error:'Dados obrigatórios ausentes'},{status:400})
 const own=await sql`select id from work_orders where id=${workOrderId} and company_id=${companyId} limit 1`;if(!own.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
 const rows=await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${workOrderId},${String(body.eventType||'note')},${title},${detail}) returning *`
 return NextResponse.json(rows[0],{status:201})}catch{return NextResponse.json({error:'Não foi possível registrar histórico'},{status:500})}
}