import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
const money=(v:unknown)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export default async function ChargePage({params}:{params:Promise<{token:string}>}){
 const {token}=await params,sql=getDb()
 const rows=await sql`select f.amount,f.due_date,f.status,f.paid_at,f.description,w.code,w.title,c.name client,co.name company_name,co.phone,co.whatsapp,co.email,co.logo_url,co.primary_color from financial_entries f join work_orders w on w.id=f.work_order_id and w.company_id=f.company_id left join clients c on c.id=w.client_id and c.company_id=w.company_id join companies co on co.id=f.company_id where f.public_token::text=${token} and f.entry_type='receivable' limit 1`
 if(!rows.length)notFound()
 const x:any=rows[0],color=/^#[0-9a-f]{6}$/i.test(String(x.primary_color||''))?String(x.primary_color):'#3157ff'
 const paid=x.status==='paid'
 return <main style={{maxWidth:620,margin:'48px auto',padding:24,fontFamily:'Arial,sans-serif',color:'#172033'}}>
  <section style={{border:'1px solid #e5e9ef',borderRadius:18,padding:28,boxShadow:'0 18px 50px rgba(30,42,68,.08)'}}>
   {x.logo_url&&<img src={x.logo_url} alt={x.company_name} style={{maxWidth:150,maxHeight:60,objectFit:'contain',marginBottom:14}}/>}
   <div style={{fontSize:11,fontWeight:800,letterSpacing:'.12em',color}}>COBRANÇA</div>
   <h1 style={{margin:'8px 0 4px'}}>{x.company_name}</h1>
   <p style={{margin:'0 0 22px',color:'#7d8798'}}>Referente à {x.code} — {x.title}</p>
   <div style={{padding:20,borderRadius:14,background:paid?'#ecfdf3':'#f6f8fb',marginBottom:18}}>
    <span style={{display:'block',fontSize:11,color:'#7c8797'}}>Valor</span><strong style={{display:'block',fontSize:30,margin:'5px 0'}}>{money(x.amount)}</strong>
    <span style={{fontSize:12,color:'#667085'}}>Vencimento: {x.due_date?new Date(String(x.due_date)+'T12:00:00').toLocaleDateString('pt-BR'):'A combinar'}</span>
   </div>
   <p><b>Cliente:</b> {x.client||'Cliente'}</p>
   {paid?<div style={{padding:14,borderRadius:12,background:'#ecfdf3',color:'#147a55',fontWeight:800}}>✓ Pagamento baixado em {x.paid_at?new Date(x.paid_at).toLocaleString('pt-BR'):'data registrada'}</div>:<div style={{padding:14,borderRadius:12,background:'#fff7ed',color:'#9a5a13',fontWeight:700}}>Pagamento pendente</div>}
   <p style={{marginTop:22,fontSize:12,color:'#7d8798'}}>Esta cobrança permanece pendente até a empresa registrar a baixa no financeiro. O andamento da OS não é bloqueado pelo pagamento.</p>
   <div style={{marginTop:22,fontSize:12,color:'#667085'}}>{(x.whatsapp||x.phone)&&<div>Contato: {x.whatsapp||x.phone}</div>}{x.email&&<div>{x.email}</div>}</div>
  </section>
 </main>
}
