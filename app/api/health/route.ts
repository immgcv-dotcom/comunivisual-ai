import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function GET(){try{const sql=getDb();const rows=await sql`select 1 as ok`;return NextResponse.json({ok:Number(rows[0]?.ok)===1,database:'connected'})}catch(error){console.error('health-check',error);return NextResponse.json({ok:false,database:'error',error:error instanceof Error?error.message:'Erro desconhecido no banco'},{status:503})}}
