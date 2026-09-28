import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
import { createSessionRecord,hashPassword,hashToken,normalizeEmail,requestMeta,sessionCookieOptions,SESSION_COOKIE } from '@/lib/auth'

export const runtime='nodejs'

const INITIAL_SETUP_HASH='d8f0f4f96136dcc4125373437f08acb877063ebe6d95d348bbbdef2dc21b11d0'

async function resolveInitialCompany(sql:any,token:string){
 if(!token||hashToken(token)!==INITIAL_SETUP_HASH)return null
 const existing=await sql`select id from app_users limit 1`
 if(existing.length)return null
 const companies=await sql`select id,name from companies where status='active' order by case when slug='immagine' then 0 else 1 end,created_at limit 1`
 return companies[0]||null
}

export async function GET(req:Request){
 try{
  await ensureSchema()
  const token=new URL(req.url).searchParams.get('token')||'',sql=getDb()
  const company=await resolveInitialCompany(sql,token)
  return NextResponse.json(company?{valid:true,companyName:company.name}:{valid:false})
 }catch(e){
  return NextResponse.json({valid:false,error:e instanceof Error?e.message:'Erro ao validar acesso'},{status:500})
 }
}

export async function POST(req:Request){
 try{
  await ensureSchema()
  const sql=getDb(),b=await req.json(),token=String(b.token||''),name=String(b.name||'').trim(),email=normalizeEmail(b.email),password=String(b.password||'')
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return NextResponse.json({error:'Preencha nome, e-mail válido e senha com ao menos 8 caracteres.'},{status:400})
  const company=await resolveInitialCompany(sql,token)
  if(!company)return NextResponse.json({error:'Link de configuração inválido, já utilizado ou expirado.'},{status:400})
  const dup=await sql`select id from app_users where lower(email)=${email} limit 1`
  if(dup.length)return NextResponse.json({error:'Este e-mail já possui acesso.'},{status:409})
  const passwordHash=await hashPassword(password)
  const users=await sql`insert into app_users(name,email,password_hash,is_super_admin) values(${name},${email},${passwordHash},true) returning id`
  const userId=String(users[0].id),companyId=String(company.id)
  await sql`insert into company_users(company_id,user_id,role,permissions) values(${companyId},${userId},'owner','{}'::text[]) on conflict(company_id,user_id) do update set role='owner',active=true,updated_at=now()`
  await sql`update platform_setup_tokens set used_at=now() where company_id=${companyId} and used_at is null`
  const session=await createSessionRecord(userId,companyId,requestMeta(req))
  const res=NextResponse.json({ok:true})
  res.cookies.set(SESSION_COOKIE,session,sessionCookieOptions)
  return res
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:'Erro ao configurar acesso'},{status:500})
 }
}
