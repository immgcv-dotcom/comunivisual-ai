import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ensureSchema } from '@/lib/bootstrap'
import { getAuthContext,hashToken,SESSION_COOKIE } from '@/lib/auth'
import { getDb } from '@/lib/db'
export async function POST(req:Request){await ensureSchema();const ctx=await getAuthContext();if(!ctx)return NextResponse.json({error:'Não autenticado'},{status:401});const companyId=String((await req.json()).companyId||''),sql=getDb();const allowed=ctx.isSuperAdmin?await sql`select id from companies where id=${companyId} and status='active'`:await sql`select cu.id from company_users cu join companies c on c.id=cu.company_id where cu.user_id=${ctx.userId} and cu.company_id=${companyId} and cu.active=true and c.status='active'`;if(!allowed.length)return NextResponse.json({error:'Empresa não autorizada'},{status:403});const raw=(await cookies()).get(SESSION_COOKIE)?.value;if(!raw)return NextResponse.json({error:'Sessão inválida'},{status:401});await sql`update user_sessions set company_id=${companyId},last_seen_at=now() where token_hash=${hashToken(raw)}`;return NextResponse.json({ok:true})}
