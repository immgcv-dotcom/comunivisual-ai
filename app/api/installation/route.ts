import { NextRequest,NextResponse } from 'next/server'
import { ensureDb } from '@/lib/bootstrap'
import { getDb } from '@/lib/db'
export const dynamic='force-dynamic'
export async function PATCH(req:NextRequest){
 try{const companyId=await ensureDb(),sql=getDb(),b=await req.json(),id=String(b.id||'')
 if(!id)return NextResponse.json({error:'OS obrigatória'},{status:400})
 const own=await sql`select id,stage from work_orders where id=${id} and company_id=${companyId} limit 1`;if(!own.length)return NextResponse.json({error:'OS não encontrada'},{status:404})
 if(['Cancelado','Concluído'].includes(String(own[0].stage)))return NextResponse.json({error:'OS encerrada não permite alterar instalação.'},{status:409});if(!['Produção','Instalação'].includes(String(own[0].stage)))return NextResponse.json({error:'O planejamento da instalação só pode ser definido após a OS entrar em produção.'},{status:409})
 const scheduled=b.scheduledAt?new Date(String(b.scheduledAt)):null;if(scheduled&&Number.isNaN(scheduled.getTime()))return NextResponse.json({error:'Data de instalação inválida'},{status:400});const team=String(b.team||'').trim(),address=String(b.address||'').trim(),notes=String(b.notes||'').trim();if(scheduled&&(!team||!address))return NextResponse.json({error:'Informe equipe e endereço ao agendar a instalação.'},{status:400})
 const rows=await sql`update work_orders set installation_scheduled_at=${scheduled?scheduled.toISOString():null},installation_team=${team},installation_address=${address},installation_notes=${notes} where id=${id} and company_id=${companyId} returning *`
 await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${id},'installation','Instalação atualizada',${scheduled?'Agendada para '+scheduled.toLocaleString('pt-BR'):'Planejamento de instalação atualizado'})`
 return NextResponse.json(rows[0])}catch{return NextResponse.json({error:'Não foi possível atualizar a instalação.'},{status:500})}
}