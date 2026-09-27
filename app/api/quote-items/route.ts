import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'

export async function GET(req:Request){
 try{const companyId=await ensureDb();const sql=getDb();const id=new URL(req.url).searchParams.get('workOrderId');if(!id)return NextResponse.json({error:'OS obrigatória'},{status:400});const rows=await sql`select i.* from work_order_items i join work_orders w on w.id=i.work_order_id where i.work_order_id=${id} and w.company_id=${companyId} order by i.created_at`;return NextResponse.json(rows)}
 catch{return NextResponse.json({error:'Erro ao carregar itens'},{status:500})}
}
export async function POST(req:Request){
 try{const companyId=await ensureDb();const sql=getDb();const b=await req.json();if(!b.workOrderId||!String(b.description||'').trim())return NextResponse.json({error:'Descrição obrigatória'},{status:400});const os=await sql`select id from work_orders where id=${b.workOrderId} and company_id=${companyId} limit 1`;if(!os.length)return NextResponse.json({error:'OS não encontrada'},{status:404});const q=Math.max(Number(b.quantity)||1,0);const p=Math.max(Number(b.unitPrice)||0,0);const rows=await sql`insert into work_order_items(work_order_id,description,quantity,unit,unit_price) values(${b.workOrderId},${String(b.description).trim()},${q},${b.unit||'un'},${p}) returning *`;await sql`update work_orders set total=(select coalesce(sum(quantity*unit_price),0) from work_order_items where work_order_id=${b.workOrderId}) where id=${b.workOrderId} and company_id=${companyId}`;return NextResponse.json(rows[0],{status:201})}
 catch{return NextResponse.json({error:'Erro ao adicionar item'},{status:500})}
}
export async function DELETE(req:Request){
 try{const companyId=await ensureDb();const sql=getDb();const b=await req.json();const found=await sql`select i.work_order_id from work_order_items i join work_orders w on w.id=i.work_order_id where i.id=${b.id} and w.company_id=${companyId} limit 1`;if(!found.length)return NextResponse.json({error:'Item não encontrado'},{status:404});const workOrderId=found[0].work_order_id;await sql`delete from work_order_items where id=${b.id}`;await sql`update work_orders set total=(select coalesce(sum(quantity*unit_price),0) from work_order_items where work_order_id=${workOrderId}) where id=${workOrderId} and company_id=${companyId}`;return NextResponse.json({ok:true})}
 catch{return NextResponse.json({error:'Erro ao excluir item'},{status:500})}
}
