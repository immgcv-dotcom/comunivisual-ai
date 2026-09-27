import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
export async function GET(){
 try{const companyId=await ensureDb();const sql=getDb();const rows=await sql`select f.id,f.work_order_id,f.entry_type,f.description,f.amount,f.due_date,f.paid_at,f.status,f.created_at,w.code from financial_entries f left join work_orders w on w.id=f.work_order_id where f.company_id=${companyId} order by coalesce(f.due_date,current_date),f.created_at desc`;return NextResponse.json(rows)}
 catch{return NextResponse.json({error:'Erro ao carregar financeiro'},{status:500})}
}
