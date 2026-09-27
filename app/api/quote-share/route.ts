import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
export async function POST(req:Request){try{const companyId=await ensureDb();const sql=getDb();const b=await req.json();if(!b.id)return NextResponse.json({error:'OS obrigatória'},{status:400});const rows=await sql`update work_orders set public_token=coalesce(public_token,gen_random_uuid()) where id=${b.id} and company_id=${companyId} returning public_token`;if(!rows.length)return NextResponse.json({error:'OS não encontrada'},{status:404});const origin=new URL(req.url).origin;return NextResponse.json({url:origin+'/orcamento/'+rows[0].public_token})}catch{return NextResponse.json({error:'Erro ao criar link'},{status:500})}}
