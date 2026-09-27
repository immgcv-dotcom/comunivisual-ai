import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
export const dynamic='force-dynamic'
export async function GET(){try{await ensureDb();return NextResponse.json({ok:true,database:'connected'})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'database error'},{status:500})}}
