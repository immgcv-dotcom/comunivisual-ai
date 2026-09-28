import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
export async function GET(){try{await ensureDb();return NextResponse.json({ok:true,database:'connected'})}catch(error){console.error('health-check',error);return NextResponse.json({ok:false,database:'error',error:error instanceof Error?error.message:'Erro desconhecido no banco'},{status:503})}}
