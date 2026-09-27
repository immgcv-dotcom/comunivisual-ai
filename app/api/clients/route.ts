import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'

export async function GET(){
 try{const companyId=await ensureDb();const sql=getDb();const rows=await sql`select id,name,person_type,document,legal_name,trade_name,state_registration,phone,whatsapp,email,postal_code,street,address_number,complement,district,city,state,created_at from clients where company_id=${companyId} order by name`;return NextResponse.json(rows)}
 catch{return NextResponse.json({error:'Erro ao carregar clientes'},{status:500})}
}
export async function POST(req:Request){
 try{
  const companyId=await ensureDb();const sql=getDb();const b=await req.json();const document=String(b.document||'').replace(/\D/g,'')||null
  const name=String(b.tradeName||b.name||b.legalName||'').trim()
  if(!name) return NextResponse.json({error:'Nome do cliente é obrigatório'},{status:400})
  if(document){const found=await sql`select id from clients where company_id=${companyId} and document=${document} limit 1`;if(found.length)return NextResponse.json({error:'CNPJ/CPF já cadastrado'},{status:409})}
  const rows=await sql`insert into clients(company_id,name,person_type,document,legal_name,trade_name,state_registration,phone,whatsapp,email,postal_code,street,address_number,complement,district,city,state) values(${companyId},${name},${b.personType==='PF'?'PF':'PJ'},${document},${b.legalName||null},${b.tradeName||null},${b.stateRegistration||null},${b.phone||null},${b.whatsapp||null},${b.email||null},${b.postalCode||null},${b.street||null},${b.number||null},${b.complement||null},${b.district||null},${b.city||null},${b.state||null}) returning *`
  return NextResponse.json(rows[0],{status:201})
 }catch{return NextResponse.json({error:'Erro ao cadastrar cliente'},{status:500})}
}
