import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
export async function GET(){try{await ensureDb();return NextResponse.json({ok:true,database:'connected'})}catch{return NextResponse.json({ok:false,error:'Serviço temporariamente indisponível'},{status:503})}}
