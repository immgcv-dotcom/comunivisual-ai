'use client'

import { useMemo, useState } from 'react'

type Stage = 'Orçamento' | 'Aprovado' | 'Arte' | 'Produção' | 'Instalação' | 'Concluído'
type Service = {
  id: string
  client: string
  title: string
  value: number
  stage: Stage
  due: string
  progress: number
  color: string
}

const stages: Stage[] = ['Orçamento', 'Aprovado', 'Arte', 'Produção', 'Instalação', 'Concluído']

const initialServices: Service[] = [
  { id:'OS-1254', client:'Mercado São Lucas', title:'Fachada ACM + letras caixa', value:4950, stage:'Produção', due:'04/10', progress:68, color:'#2f6fed' },
  { id:'OS-1255', client:'João Auto Peças', title:'Adesivagem de veículo', value:1850, stage:'Arte', due:'03/10', progress:32, color:'#8b5cf6' },
  { id:'OS-1256', client:'Farmácia Central', title:'Totem + fachada iluminada', value:8900, stage:'Orçamento', due:'07/10', progress:10, color:'#f59e0b' },
  { id:'OS-1251', client:'Atacadão do Vale', title:'Placas de sinalização', value:3200, stage:'Aprovado', due:'02/10', progress:18, color:'#06b6d4' },
  { id:'OS-1248', client:'Clínica Vitta', title:'Letreiro acrílico retroiluminado', value:2780, stage:'Instalação', due:'28/09', progress:88, color:'#10b981' },
  { id:'OS-1239', client:'Padaria Imperial', title:'Painel + adesivos de vitrine', value:2380, stage:'Concluído', due:'26/09', progress:100, color:'#64748b' }
]

const money = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export default function Home(){
  const [section,setSection]=useState<'services'|'finance'|'brand'>('services')
  const [filter,setFilter]=useState<'Todos'|Stage>('Todos')
  const [services,setServices]=useState(initialServices)
  const [selected,setSelected]=useState<Service|null>(initialServices[0])
  const [brand,setBrand]=useState({name:'ComuniVisual AI', primary:'#3157ff', accent:'#16c79a', logoText:'CV'})
  const [draftBrand,setDraftBrand]=useState(brand)
  const [showNew,setShowNew]=useState(false)
  const [aiText,setAiText]=useState('')
  const [aiResult,setAiResult]=useState<string | null>(null)

  const filtered=useMemo(()=> filter==='Todos'?services:services.filter(s=>s.stage===filter),[filter,services])
  const totalOpen=services.filter(s=>s.stage!=='Concluído').reduce((a,b)=>a+b.value,0)
  const totalDone=services.filter(s=>s.stage==='Concluído').reduce((a,b)=>a+b.value,0)

  function moveStage(s:Service,dir:number){
    const idx=stages.indexOf(s.stage)
    const next=stages[Math.max(0,Math.min(stages.length-1,idx+dir))]
    const progress=Math.round(((stages.indexOf(next)+1)/stages.length)*100)
    const updated={...s,stage:next,progress}
    setServices(prev=>prev.map(x=>x.id===s.id?updated:x))
    setSelected(updated)
  }

  function runAI(){
    const t=aiText.toLowerCase()
    let response='Interpretei o pedido e preparei uma estrutura inicial de orçamento. Revise medidas e materiais antes de aprovar.'
    if(t.includes('fachada')) response='Sugestão: fachada em ACM + estrutura metálica + acabamento + instalação. Posso transformar isso em orçamento, lista de materiais e etapas de produção.'
    if(t.includes('adesiv')) response='Sugestão: calcular área de impressão, laminação, perda, aplicação e tempo de produção. Posso montar a composição do orçamento automaticamente.'
    setAiResult(response)
  }

  return <div className="app" style={{'--primary':brand.primary,'--accent':brand.accent} as React.CSSProperties}>
    <aside className="sidebar">
      <div className="brandBlock"><div className="brandLogo">{brand.logoText}</div><div><strong>{brand.name}</strong><span>ERP inteligente</span></div></div>
      <nav>
        <button className={section==='services'?'active':''} onClick={()=>setSection('services')}>▦ <span>Central de Serviços</span></button>
        <button className={section==='finance'?'active':''} onClick={()=>setSection('finance')}>$ <span>Financeiro</span></button>
      </nav>
      <div className="sidebarBottom">
        <button className={section==='brand'?'active':''} onClick={()=>setSection('brand')}>⚙ <span>Personalização</span></button>
        <div className="user"><div className="avatar">IM</div><div><b>Administrador</b><small>Empresa demo</small></div></div>
      </div>
    </aside>

    <main>
      <header><div><h1>{section==='services'?'Central de Serviços':section==='finance'?'Financeiro':'Personalização da Empresa'}</h1><p>{section==='services'?'Do primeiro atendimento à entrega, tudo no mesmo lugar.':section==='finance'?'Caixa, contas, recebimentos e resultado.':'Deixe o sistema com a cara de cada cliente.'}</p></div><div className="headerActions"><button className="ghost">⌕ Pesquisar</button>{section==='services'&&<button className="primary" onClick={()=>setShowNew(true)}>+ Novo serviço</button>}</div></header>

      {section==='services' && <>
        <section className="metrics">
          <div className="metric"><span>Serviços em andamento</span><b>{services.filter(s=>!['Concluído'].includes(s.stage)).length}</b><small>operação ativa</small></div>
          <div className="metric"><span>Em produção</span><b>{services.filter(s=>s.stage==='Produção').length}</b><small>na fábrica agora</small></div>
          <div className="metric"><span>Valor em aberto</span><b>{money(totalOpen)}</b><small>orçamentos + pedidos</small></div>
          <div className="metric"><span>Concluído recente</span><b>{money(totalDone)}</b><small>serviços finalizados</small></div>
        </section>

        <section className="aiBox"><div className="aiIcon">✦</div><div className="aiContent"><b>Assistente IA</b><span>Descreva o serviço e deixe a IA preparar orçamento, materiais e produção.</span><div className="aiRow"><input value={aiText} onChange={e=>setAiText(e.target.value)} placeholder='Ex.: fachada de ACM preta 5,80 x 1,10 com letras em PVC e instalação'/><button onClick={runAI}>Gerar</button></div>{aiResult&&<div className="aiResult">{aiResult}</div>}</div></section>

        <div className="filters"><button className={filter==='Todos'?'selected':''} onClick={()=>setFilter('Todos')}>Todos <em>{services.length}</em></button>{stages.map(s=><button key={s} className={filter===s?'selected':''} onClick={()=>setFilter(s)}>{s} <em>{services.filter(x=>x.stage===s).length}</em></button>)}</div>

        <section className="serviceGrid">{filtered.map(s=><article className="serviceCard" key={s.id} onClick={()=>setSelected(s)}>
          <div className="cardTop"><span className="os">{s.id}</span><span className={'pill '+s.stage.toLowerCase().replace('ç','c').replace('ã','a')}>{s.stage}</span></div>
          <h3>{s.client}</h3><p>{s.title}</p>
          <div className="cardMeta"><span>Entrega <b>{s.due}</b></span><strong>{money(s.value)}</strong></div>
          <div className="progress"><i style={{width:`${s.progress}%`,background:s.color}}/></div>
          <div className="cardFoot"><span>{s.progress}% concluído</span><span>Ver serviço →</span></div>
        </article>)}</section>
      </>}

      {section==='finance' && <section className="financePage">
        <div className="financeHero"><div><span>Saldo projetado</span><h2>{money(38740)}</h2><small>próximos 30 dias</small></div><div className="financeHeroRight"><div><span>A receber</span><b>{money(25680)}</b></div><div><span>A pagar</span><b>{money(9860)}</b></div></div></div>
        <div className="financeCards"><div><span>Recebimentos hoje</span><b>{money(4750)}</b><small>3 lançamentos</small></div><div><span>Vencendo esta semana</span><b>{money(6240)}</b><small>7 contas</small></div><div><span>Em atraso</span><b>{money(1320)}</b><small>2 clientes</small></div><div><span>Margem média</span><b>39,8%</b><small>últimos 30 dias</small></div></div>
        <div className="panel"><div className="panelTitle"><h3>Movimentações recentes</h3><button>Ver todas</button></div>{[
          ['Mercado São Lucas','Entrada OS-1254','+ R$ 2.475,00','Recebido'],['Fornecedor ACM Brasil','Compra de chapas','- R$ 1.180,00','Pago'],['Clínica Vitta','Saldo OS-1248','+ R$ 1.390,00','Pendente'],['Energia','Conta mensal','- R$ 860,00','Agendado']
        ].map((r,i)=><div className="transaction" key={i}><div className="txIcon">{r[2].startsWith('+')?'↓':'↑'}</div><div><b>{r[0]}</b><span>{r[1]}</span></div><strong className={r[2].startsWith('+')?'positive':'negative'}>{r[2]}</strong><em>{r[3]}</em></div>)}</div>
      </section>}

      {section==='brand' && <section className="brandPage">
        <div className="panel brandEditor"><div className="panelTitle"><div><h3>Identidade visual</h3><p>Estas configurações podem ser diferentes para cada empresa cliente.</p></div></div>
          <label>Nome do sistema/empresa<input value={draftBrand.name} onChange={e=>setDraftBrand({...draftBrand,name:e.target.value})}/></label>
          <label>Iniciais da logo<input maxLength={3} value={draftBrand.logoText} onChange={e=>setDraftBrand({...draftBrand,logoText:e.target.value.toUpperCase()})}/></label>
          <div className="colorFields"><label>Cor principal<input type="color" value={draftBrand.primary} onChange={e=>setDraftBrand({...draftBrand,primary:e.target.value})}/></label><label>Cor de destaque<input type="color" value={draftBrand.accent} onChange={e=>setDraftBrand({...draftBrand,accent:e.target.value})}/></label></div>
          <button className="primary wide" onClick={()=>setBrand(draftBrand)}>Aplicar identidade</button>
        </div>
        <div className="previewBox"><span>Pré-visualização</span><div className="miniApp"><div className="miniSide"><div className="brandLogo">{draftBrand.logoText}</div><b>{draftBrand.name}</b><i style={{background:draftBrand.primary}}></i><i></i><i></i></div><div className="miniMain"><div className="miniHead"></div><div className="miniBanner" style={{background:draftBrand.primary}}></div><div className="miniCards"><i/><i/><i/></div><div className="miniAccent" style={{background:draftBrand.accent}}></div></div></div><p>Logo completa, ícone, favicon, cores, documentos e PDFs poderão seguir a mesma identidade.</p></div>
      </section>}
    </main>

    {selected && section==='services' && <div className="drawerOverlay" onClick={()=>setSelected(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">{selected.id}</span><h2>{selected.client}</h2><p className="subtitle">{selected.title}</p><div className="drawerValue">{money(selected.value)}<span>{selected.stage}</span></div><div className="timeline">{stages.map((st,i)=><div className={i<=stages.indexOf(selected.stage)?'done':''} key={st}><i></i><span>{st}</span></div>)}</div><div className="detailBlock"><h4>Resumo da OS</h4><div className="detailRow"><span>Entrega</span><b>{selected.due}</b></div><div className="detailRow"><span>Progresso</span><b>{selected.progress}%</b></div><div className="detailRow"><span>Responsável</span><b>Equipe Produção</b></div></div><div className="detailBlock"><h4>Próximas ações</h4><button className="action">✓ Checklist de produção</button><button className="action">▣ Materiais e estoque</button><button className="action">⌁ Arquivos e arte</button><button className="action">💬 Conversa com cliente</button></div><div className="drawerButtons"><button onClick={()=>moveStage(selected,-1)}>← Voltar etapa</button><button className="primary" onClick={()=>moveStage(selected,1)}>Avançar etapa →</button></div></aside></div>}

    {showNew && <div className="modalOverlay" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowNew(false)}>×</button><span className="eyebrow">NOVO SERVIÇO</span><h2>Comece pelo que o cliente pediu</h2><p>A OS seguirá do orçamento até a conclusão sem precisar ser recriada em outros módulos.</p><label>Cliente<input placeholder="Nome do cliente"/></label><label>Serviço<input placeholder="Ex.: Fachada ACM + letra caixa"/></label><div className="two"><label>Valor estimado<input placeholder="R$ 0,00"/></label><label>Prazo<input type="date"/></label></div><button className="primary wide" onClick={()=>setShowNew(false)}>Criar serviço</button></div></div>}
  </div>
}
