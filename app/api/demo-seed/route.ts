import { NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
import { seedDemoData } from '@/lib/demo-seed'
export const dynamic='force-dynamic'
export async function GET(){try{const companyId=await ensureDb();await seedDemoData(getDb(),companyId);return NextResponse.json({ok:true,message:'Dados DEMO carregados.'})}catch(error){console.error('demo-seed',error);return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Falha ao carregar dados DEMO'},{status:500})}}
