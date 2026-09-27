import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function GET(){try{const companyId=await ensureDb(),sql=getDb()
 const stages=await sql`select stage,count(*)::int n,coalesce(sum(total),0) value from work_orders where company_id=${companyId} and stage<>'Cancelado' group by stage`
 const overdue=await sql`select count(*)::int n from work_orders where company_id=${companyId} and stage not in ('Concluído','Cancelado') and due_date<current_date`
 const stock=await sql`select count(*)::int n from materials where company_id=${companyId} and stock_quantity<=min_stock`
 const finance=await sql`select coalesce(sum(case when entry_type='receivable' and status='pending' and due_date<current_date then amount else 0 end),0) overdue_receivables,coalesce(sum(case when entry_type='receivable' and status='pending' then amount else 0 end),0) receivables from financial_entries where company_id=${companyId}`
 const production=await sql`select count(*)::int open,count(*) filter(where t.status='doing')::int doing from work_order_tasks t join work_orders w on w.id=t.work_order_id where w.company_id=${companyId} and w.stage not in ('Concluído','Cancelado') and t.status<>'done'`
 const alerts=await sql`select w.id,w.code,w.title,w.stage,w.due_date,c.trade_name,c.legal_name from work_orders w left join clients c on c.id=w.client_id where w.company_id=${companyId} and w.stage not in ('Concluído','Cancelado') and (w.due_date<current_date or (w.stage='Arte' and not exists(select 1 from artwork_versions a where a.work_order_id=w.id and a.company_id=${companyId} and a.status='approved'))) order by w.due_date nulls last limit 12`
 return NextResponse.json({stages,overdue:Number(overdue[0]?.n||0),lowStock:Number(stock[0]?.n||0),overdueReceivables:Number(finance[0]?.overdue_receivables||0),receivables:Number(finance[0]?.receivables||0),production:{open:Number(production[0]?.open||0),doing:Number(production[0]?.doing||0)},alerts})}catch{return NextResponse.json({error:'Não foi possível carregar indicadores.'},{status:500})}}