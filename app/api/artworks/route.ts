import { NextRequest,NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'

export async function GET(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),workOrderId=req.nextUrl.searchParams.get('workOrderId')
 if(!workOrderId)return NextResponse.json({error:'OS obrigatória'},{status:400})
 const rows=await sql`select a.* from artwork_versions a join work_orders w on w.id=a.work_order_id where a.work_order_id=${workOrderId} and a.company_id=${companyId} and w.company_id=${companyId} order by a.version_no desc`
 return NextResponse.json(rows)}catch{return NextResponse.json({error:'Serviço temporariamente indisponível'},{status:503})}
}
export async function POST(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),body=await req.json(),workOrderId=String(body.workOrderId||''),fileUrl=String(body.fileUrl||'').trim(),fileName=String(body.fileName||'').trim()
 if(!workOrderId||!fileName||!/^https:\/\//i.test(fileUrl))return NextResponse.json({error:'Informe nome e URL HTTPS válida da arte.'},{status:400})
 const own=await sql`select id from work_orders where id=${workOrderId} and company_id=${companyId} limit 1`;if(!own.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
 const n=await sql`select coalesce(max(version_no),0)+1 as next from artwork_versions where work_order_id=${workOrderId}`
 const rows=await sql`insert into artwork_versions(company_id,work_order_id,version_no,file_url,file_name,note) values(${companyId},${workOrderId},${Number(n[0].next)},${fileUrl},${fileName},${String(body.note||'').trim()}) returning *`
 await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${workOrderId},'artwork','Nova versão de arte',${'V'+Number(n[0].next)+' · '+fileName})`
 return NextResponse.json(rows[0],{status:201})}catch{return NextResponse.json({error:'Não foi possível salvar a arte.'},{status:500})}
}
export async function PATCH(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),body=await req.json(),id=String(body.id||''),status=body.status==='approved'?'approved':body.status==='changes'?'changes':'pending'
 const rows=await sql`update artwork_versions set status=${status},approved_at=${status==='approved'?new Date().toISOString():null} where id=${id} and company_id=${companyId} returning *`
 if(!rows.length)return NextResponse.json({error:'Arte não encontrada'},{status:404});await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${rows[0].work_order_id},'artwork',${status==='approved'?'Arte aprovada':status==='changes'?'Alteração solicitada na arte':'Arte voltou para análise'},${'V'+rows[0].version_no+' · '+rows[0].file_name})`;return NextResponse.json(rows[0])}catch{return NextResponse.json({error:'Não foi possível atualizar a arte.'},{status:500})}
}