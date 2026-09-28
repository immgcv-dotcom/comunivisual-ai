import { NextRequest,NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),id=req.nextUrl.searchParams.get('workOrderId');if(!id)return NextResponse.json({error:'OS obrigatória'},{status:400})
 const w=await sql`select id,code,total,estimated_cost,actual_cost,stage from work_orders where id=${id} and company_id=${companyId} limit 1`;if(!w.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
 const fin=await sql`select coalesce(sum(case when entry_type='receivable' and status='paid' then amount else 0 end),0) received,coalesce(sum(case when entry_type='payable' and status='paid' then amount else 0 end),0) paid_cost,coalesce(sum(case when entry_type='receivable' and status='pending' then amount else 0 end),0) receivable from financial_entries where company_id=${companyId} and work_order_id=${id}`
 const inventory=await sql`select coalesce(sum(abs(quantity)*unit_cost),0) material_cost from inventory_movements where company_id=${companyId} and work_order_id=${id} and movement_type='consume'`\n const x=w[0],f=fin[0],sale=Number(x.total||0),estimated=Number(x.estimated_cost||0),paidCost=Number(f.paid_cost||0),materialCost=Number(inventory[0]?.material_cost||0),actual=paidCost+materialCost,result=sale-actual
 return NextResponse.json({code:x.code,stage:x.stage,sale,estimatedCost:estimated,actualCost:actual,materialCost,paidCost,estimatedResult:sale-estimated,actualResult:result,estimatedMargin:sale>0?(sale-estimated)/sale*100:0,actualMargin:sale>0?result/sale*100:0,received:Number(f.received||0),receivable:Number(f.receivable||0)})}
 catch{return NextResponse.json({error:'Não foi possível calcular o resultado da OS.'},{status:500})}
}