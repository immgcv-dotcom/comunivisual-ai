import { NextResponse } from 'next/server'
import { ensureAuthSchema } from '@/lib/bootstrap'
import { getAuthContext,effectivePermissions } from '@/lib/auth'
import { getDb } from '@/lib/db'
export async function GET(){await ensureAuthSchema();const ctx=await getAuthContext();if(!ctx)return NextResponse.json({error:'Não autenticado'},{status:401});const sql=getDb();const memberships=ctx.isSuperAdmin?await sql`select c.id company_id,c.name,c.slug,'platform' role,'{}'::text[] permissions from companies c where c.status='active' order by c.name`:await sql`select cu.company_id,c.name,c.slug,cu.role,cu.permissions from company_users cu join companies c on c.id=cu.company_id where cu.user_id=${ctx.userId} and cu.active=true and c.status='active' order by c.name`;return NextResponse.json({...ctx,memberships:memberships.map((m:any)=>({...m,permissions:effectivePermissions(String(m.role||'member'),m.permissions,ctx.isSuperAdmin)}))})}
