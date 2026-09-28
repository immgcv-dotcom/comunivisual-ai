import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { hashToken,SESSION_COOKIE } from '@/lib/auth'
export async function POST(){const raw=(await cookies()).get(SESSION_COOKIE)?.value;if(raw){try{const sql=getDb();await sql`delete from user_sessions where token_hash=${hashToken(raw)}`}catch{}}const res=NextResponse.json({ok:true});res.cookies.delete(SESSION_COOKIE);return res}
