import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
const allowed=['Atendimento','Orçamento','Aprovado','Arte','Produção','Instalação','Concluído','Cancelado']
export async function GET(){try{const companyId=await ensureDb();const sql=getDb();const rows=await sql`select w.id,w.code,w.title,w.stage,w.total,w.due_date,w.created_at,c.name client from work_orders w left join clients c on c.id=w.client_id where w.company_id=${companyId} order by w.created_at desc`;return NextResponse.json(rows)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro no banco'},{status:500})}}
export async function POST(req:Request){try{const companyId=await ensureDb();const sql=getDb();const b=await req.json();if(!b.title?.trim())return NextResponse.json({error:'Serviço é obrigatório'},{status:400});
let clientId:string|undefined
let clientName=''
if(b.clientId){
 const found=await sql`select id,name from clients where id=${String(b.clientId)} and company_id=${companyId} limit 1`
 if(found.length){clientId=String(found[0].id);clientName=String(found[0].name)}
}else if(b.client?.trim()){
 const name=String(b.client).trim()
 let found=await sql`select id,name from clients where company_id=${companyId} and lower(name)=lower(${name}) limit 1`
 if(!found.length) found=await sql`insert into clients(company_id,name) values(${companyId},${name}) returning id,name`
 clientId=String(found[0].id);clientName=String(found[0].name)
}
if(!clientId)return NextResponse.json({error:'Selecione um cliente válido'},{status:400});
const seq=await sql`select coalesce(max(nullif(regexp_replace(code,'\\D','','g'),'')::int),1250)+1 n from work_orders where company_id=${companyId}`;const code='OS-'+seq[0].n;const stage=allowed.includes(b.stage)?b.stage:'Atendimento';const total=Number(b.total)||0;const due=b.due||null;const rows=await sql`insert into work_orders(company_id,client_id,code,title,stage,total,due_date) values(${companyId},${clientId},${code},${b.title.trim()},${stage},${total},${due}) returning *`;return NextResponse.json({...rows[0],client:clientName},{status:201})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao criar OS'},{status:500})}}
export async function PATCH(req:Request){try{const companyId=await ensureDb();const sql=getDb();const b=await req.json();if(!b.id||!allowed.includes(b.stage))return NextResponse.json({error:'Dados inválidos'},{status:400});const rows=await sql`update work_orders set stage=${b.stage}, approved_at=case when ${b.stage}='Aprovado' then coalesce(approved_at,now()) else approved_at end where id=${b.id} and company_id=${companyId} returning *`;if(rows.length&&b.stage==='Aprovado'){const w=rows[0];await sql`insert into financial_entries(company_id,work_order_id,entry_type,description,amount,due_date,status) values(${companyId},${w.id},'receivable',${'Recebimento '+w.code+' — '+w.title},${w.total},${w.due_date},'pending') on conflict (work_order_id,entry_type) where work_order_id is not null and entry_type='receivable' do update set amount=excluded.amount,due_date=excluded.due_date,description=excluded.description`}return NextResponse.json(rows[0]||null)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao atualizar'},{status:500})}}
