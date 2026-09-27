import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function GET(){try{const companyId=await ensureDb();const sql=getDb();const company=await sql`select name,document,phone,whatsapp,email,logo_url,primary_color,accent_color from companies where id=${companyId} limit 1`;return NextResponse.json({ok:true,database:'connected',company:company[0]||null})}catch{return NextResponse.json({ok:false,error:'Serviço temporariamente indisponível'},{status:503})}}
