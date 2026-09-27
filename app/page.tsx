'use client'

import { useEffect, useMemo, useState } from 'react'

type Stage = 'Atendimento' | 'Orçamento' | 'Aprovado' | 'Arte' | 'Produção' | 'Instalação' | 'Concluído'
type Service = {
  id: string
  dbId?: string
  client: string
  title: string
  value: number
  stage: Stage
  due: string
  progress: number
  color: string
}

const stages: Stage[] = ['Atendimento', 'Orçamento', 'Aprovado', 'Arte', 'Produção', 'Instalação', 'Concluído']

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
  const [section,setSection]=useState<'services'|'clients'|'finance'|'brand'>('services')
  const [filter,setFilter]=useState<'Todos'|Stage>('Todos')
  const [services,setServices]=useState(initialServices)
  const [selected,setSelected]=useState<Service|null>(initialServices[0])
  const [brand,setBrand]=useState({name:'ComuniVisual AI', primary:'#3157ff', accent:'#16c79a', logoText:'CV'})
  const [draftBrand,setDraftBrand]=useState(brand)
  const [showNew,setShowNew]=useState(false)
  const [aiText,setAiText]=useState('')
  const [aiResult,setAiResult]=useState<string | null>(null)
  const [newService,setNewService]=useState({clientId:'',client:'',title:'',total:'',due:''})
  const [dbStatus,setDbStatus]=useState<'loading'|'online'|'offline'>('loading')
  const [dragging,setDragging]=useState<string|null>(null)
  const [clients,setClients]=useState<any[]>([])
  const [clientForm,setClientForm]=useState({document:'',legalName:'',tradeName:'',stateRegistration:'',phone:'',email:'',postalCode:'',street:'',number:'',district:'',city:'',state:''})
  const [clientMsg,setClientMsg]=useState('')
  const [quoteItems,setQuoteItems]=useState<any[]>([])
  const [quoteItem,setQuoteItem]=useState({description:'',quantity:'1',unit:'un',unitPrice:''})
  const [financeEntries,setFinanceEntries]=useState<any[]>([])
  const [tasks,setTasks]=useState<any[]>([])

  useEffect(()=>{(async()=>{try{const r=await fetch('/api/services',{cache:'no-store'});if(!r.ok) throw new Error();const rows=await r.json();setDbStatus('online');if(rows.length){setServices(rows.map((x:any)=>({dbId:x.id,id:x.code,client:x.client||'Cliente',title:x.title,value:Number(x.total),stage:x.stage as Stage,due:x.due_date?new Date(x.due_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'—',progress:Math.round(((stages.indexOf(x.stage as Stage)+1)/stages.length)*100),color:'#3157ff'})));setSelected(null)}}catch{setDbStatus('offline')}})()},[])

  async function loadFinance(){const r=await fetch('/api/finance',{cache:'no-store'});if(r.ok)setFinanceEntries(await r.json())}
  async function loadClients(){const r=await fetch('/api/clients',{cache:'no-store'});if(r.ok)setClients(await r.json())}
  async function lookupCnpj(){setClientMsg('Consultando CNPJ...');const clean=clientForm.document.replace(/\D/g,'');const r=await fetch('/api/cnpj/'+clean);const x=await r.json();if(!r.ok){setClientMsg(x.error||'Não foi possível consultar');return}setClientForm({...clientForm,...x,document:clean});setClientMsg('Dados encontrados. Confira e salve o cliente.')}
  async function saveClient(){const r=await fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...clientForm,personType:'PJ'})});const x=await r.json();if(!r.ok){setClientMsg(x.error||'Erro ao salvar');return}setClientMsg('Cliente cadastrado com sucesso.');setClientForm({document:'',legalName:'',tradeName:'',stateRegistration:'',phone:'',email:'',postalCode:'',street:'',number:'',district:'',city:'',state:''});await loadClients()}

  async function createService(){
    if(!newService.clientId||!newService.title.trim()) return
    const r=await fetch('/api/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newService)})
    if(!r.ok){setDbStatus('offline');return}
    const x=await r.json(); const item:Service={dbId:x.id,id:x.code,client:x.client,title:x.title,value:Number(x.total),stage:x.stage,due:x.due_date?new Date(x.due_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'—',progress:14,color:'#3157ff'}
    setServices(p=>[item,...p]);setShowNew(false);setNewService({clientId:'',client:'',title:'',total:'',due:''});setDbStatus('online')
  }

  const filtered=useMemo(()=> filter==='Todos'?services:services.filter(s=>s.stage===filter),[filter,services])
  const boardServices=filter==='Todos'?services:filtered
  const totalOpen=services.filter(s=>s.stage!=='Concluído').reduce((a,b)=>a+b.value,0)
  const totalDone=services.filter(s=>s.stage==='Concluído').reduce((a,b)=>a+b.value,0)

  async function setStage(s:Service,next:Stage){
    if(s.stage===next) return
    const progress=Math.round(((stages.indexOf(next)+1)/stages.length)*100)
    const updated={...s,stage:next,progress}
    setServices(prev=>prev.map(x=>x.id===s.id?updated:x))
    if(selected?.id===s.id) setSelected(updated)
    if(s.dbId){const r=await fetch('/api/services',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:s.dbId,stage:next})});if(!r.ok)setDbStatus('offline')}
  }

  async function loadTasks(s:Service){if(!s.dbId){setTasks([]);return}const r=await fetch('/api/tasks?workOrderId='+s.dbId,{cache:'no-store'});if(r.ok)setTasks(await r.json())}
  async function toggleTask(id:string,status:string){const r=await fetch('/api/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:status==='done'?'pending':'done'})});if(r.ok&&selected)await loadTasks(selected)}
  async function loadQuoteItems(s:Service){if(!s.dbId){setQuoteItems([]);return}const r=await fetch('/api/quote-items?workOrderId='+s.dbId,{cache:'no-store'});if(r.ok)setQuoteItems(await r.json())}
  async function addQuoteItem(){if(!selected?.dbId||!quoteItem.description.trim())return;const r=await fetch('/api/quote-items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workOrderId:selected.dbId,...quoteItem})});if(r.ok){setQuoteItem({description:'',quantity:'1',unit:'un',unitPrice:''});await loadQuoteItems(selected);const total=quoteItems.reduce((a:any,x:any)=>a+Number(x.quantity)*Number(x.unit_price),0);void total;const sr=await fetch('/api/services',{cache:'no-store'});if(sr.ok){const rows=await sr.json();const row=rows.find((x:any)=>x.id===selected.dbId);if(row){const value=Number(row.total);setServices(p=>p.map(x=>x.dbId===selected.dbId?{...x,value}:x));setSelected({...selected,value})}}}}
  async function removeQuoteItem(id:string){if(!selected)return;const r=await fetch('/api/quote-items',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(r.ok){await loadQuoteItems(selected);const sr=await fetch('/api/services',{cache:'no-store'});if(sr.ok){const rows=await sr.json();const row=rows.find((x:any)=>x.id===selected.dbId);if(row){const value=Number(row.total);setServices(p=>p.map(x=>x.dbId===selected.dbId?{...x,value}:x));setSelected({...selected,value})}}}}

  async function moveStage(s:Service,dir:number){
    const idx=stages.indexOf(s.stage)
    const next=stages[Math.max(0,Math.min(stages.length-1,idx+dir))]
    await setStage(s,next)
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
        <button className={section==='clients'?'active':''} onClick={()=>{setSection('clients');loadClients()}}>♙ <span>Clientes</span></button>
        <button className={section==='finance'?'active':''} onClick={()=>{setSection('finance');loadFinance()}}>$ <span>Financeiro</span></button>
      </nav>
      <div className="sidebarBottom">
        <button className={section==='brand'?'active':''} onClick={()=>setSection('brand')}>⚙ <span>Personalização</span></button>
        <div className="user"><div className="avatar">IM</div><div><b>Administrador</b><small>Empresa demo</small></div></div>
      </div>
    </aside>

    <main>
      <header><div><h1>{section==='services'?'Central de Serviços':section==='clients'?'Clientes':section==='finance'?'Financeiro':'Personalização da Empresa'}</h1><p>{section==='services'?'Do primeiro atendimento à entrega, tudo no mesmo lugar.':section==='clients'?'Cadastre empresas e use os dados diretamente nos orçamentos e OS.':section==='finance'?'Caixa, contas, recebimentos e resultado.':'Deixe o sistema com a cara de cada cliente.'} {section==='services'&&<small style={{marginLeft:8}}>Banco: {dbStatus==='online'?'● online':dbStatus==='offline'?'● offline':'conectando...'}</small>}</p></div><div className="headerActions"><button className="ghost">⌕ Pesquisar</button>{section==='services'&&<button className="primary" onClick={()=>setShowNew(true)}>+ Novo serviço</button>}</div></header>

      {section==='services' && <>
        <section className="metrics">
          <div className="metric"><span>Serviços em andamento</span><b>{services.filter(s=>!['Concluído'].includes(s.stage)).length}</b><small>operação ativa</small></div>
          <div className="metric"><span>Em produção</span><b>{services.filter(s=>s.stage==='Produção').length}</b><small>na fábrica agora</small></div>
          <div className="metric"><span>Valor em aberto</span><b>{money(totalOpen)}</b><small>orçamentos + pedidos</small></div>
          <div className="metric"><span>Concluído recente</span><b>{money(totalDone)}</b><small>serviços finalizados</small></div>
        </section>

        <section className="aiBox"><div className="aiIcon">✦</div><div className="aiContent"><b>Assistente IA</b><span>Descreva o serviço e deixe a IA preparar orçamento, materiais e produção.</span><div className="aiRow"><input value={aiText} onChange={e=>setAiText(e.target.value)} placeholder='Ex.: fachada de ACM preta 5,80 x 1,10 com letras em PVC e instalação'/><button onClick={runAI}>Gerar</button></div>{aiResult&&<div className="aiResult">{aiResult}</div>}</div></section>

        <div className="filters"><button className={filter==='Todos'?'selected':''} onClick={()=>setFilter('Todos')}>Todos <em>{services.length}</em></button>{stages.map(s=><button key={s} className={filter===s?'selected':''} onClick={()=>setFilter(s)}>{s} <em>{services.filter(x=>x.stage===s).length}</em></button>)}</div>

        <section className="kanbanBoard">{stages.map(stage=><div className="kanbanColumn" key={stage} onDragOver={e=>e.preventDefault()} onDrop={async e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const item=services.find(x=>x.id===id);setDragging(null);if(item) await setStage(item,stage)}}>
          <div className="kanbanHead"><div><b>{stage}</b><span>{boardServices.filter(x=>x.stage===stage).length}</span></div><small>{money(boardServices.filter(x=>x.stage===stage).reduce((a,b)=>a+b.value,0))}</small></div>
          <div className="kanbanList">{boardServices.filter(x=>x.stage===stage).map(s=><article draggable className={'serviceCard kanbanCard '+(dragging===s.id?'dragging':'')} key={s.id} onDragStart={e=>{setDragging(s.id);e.dataTransfer.setData('text/plain',s.id);e.dataTransfer.effectAllowed='move'}} onDragEnd={()=>setDragging(null)} onClick={()=>{setSelected(s);loadQuoteItems(s);loadTasks(s)}}>
            <div className="cardTop"><span className="os">{s.id}</span><span className="dragHandle" title="Arraste para outra etapa">⋮⋮</span></div>
            <h3>{s.client}</h3><p>{s.title}</p>
            <div className="cardMeta"><span>Entrega <b>{s.due}</b></span><strong>{money(s.value)}</strong></div>
            <div className="progress"><i style={{width:`${s.progress}%`,background:s.color}}/></div>
            <div className="cardFoot"><span>{s.progress}%</span><span>Detalhes →</span></div>
          </article>)}
          {!boardServices.some(x=>x.stage===stage)&&<div className="emptyStage">Arraste uma OS para cá</div>}</div>
        </div>)}</section>
      </>}

      {section==='clients' && <section className="clientPage">
        <div className="panel clientEditor"><div className="panelTitle"><div><h3>Novo cliente</h3><p>Digite o CNPJ para preencher os dados disponíveis automaticamente.</p></div></div>
          <div className="cnpjRow"><label>CNPJ<input value={clientForm.document} onChange={e=>setClientForm({...clientForm,document:e.target.value})} placeholder="00.000.000/0000-00"/></label><button className="primary" onClick={lookupCnpj}>Consultar CNPJ</button></div>
          {clientMsg&&<div className="clientMsg">{clientMsg}</div>}
          <div className="clientGrid"><label>Razão social<input value={clientForm.legalName} onChange={e=>setClientForm({...clientForm,legalName:e.target.value})}/></label><label>Nome fantasia<input value={clientForm.tradeName} onChange={e=>setClientForm({...clientForm,tradeName:e.target.value})}/></label><label>Inscrição Estadual<input value={clientForm.stateRegistration} onChange={e=>setClientForm({...clientForm,stateRegistration:e.target.value})} placeholder="Preencher/confirmar"/></label><label>Telefone<input value={clientForm.phone} onChange={e=>setClientForm({...clientForm,phone:e.target.value})}/></label><label>E-mail<input value={clientForm.email} onChange={e=>setClientForm({...clientForm,email:e.target.value})}/></label><label>CEP<input value={clientForm.postalCode} onChange={e=>setClientForm({...clientForm,postalCode:e.target.value})}/></label><label className="wideField">Endereço<input value={clientForm.street} onChange={e=>setClientForm({...clientForm,street:e.target.value})}/></label><label>Número<input value={clientForm.number} onChange={e=>setClientForm({...clientForm,number:e.target.value})}/></label><label>Bairro<input value={clientForm.district} onChange={e=>setClientForm({...clientForm,district:e.target.value})}/></label><label>Cidade<input value={clientForm.city} onChange={e=>setClientForm({...clientForm,city:e.target.value})}/></label><label>UF<input maxLength={2} value={clientForm.state} onChange={e=>setClientForm({...clientForm,state:e.target.value.toUpperCase()})}/></label></div>
          <button className="primary wide" onClick={saveClient}>Salvar cliente</button>
        </div>
        <div className="panel"><div className="panelTitle"><div><h3>Clientes cadastrados</h3><p>{clients.length} cliente(s)</p></div><button onClick={loadClients}>Atualizar</button></div>{clients.length===0?<div className="emptyClients">Nenhum cliente cadastrado ainda.</div>:clients.map(x=><div className="clientRow" key={x.id}><div><b>{x.trade_name||x.name}</b><span>{x.legal_name||''}</span></div><div><b>{x.document||'Sem documento'}</b><span>{[x.city,x.state].filter(Boolean).join(' / ')}</span></div></div>)}</div>
      </section>}

      {section==='finance' && <section className="financePage">
        <div className="financeHero"><div><span>Saldo projetado</span><h2>{money(financeEntries.reduce((a:any,x:any)=>a+(x.entry_type==='receivable'?Number(x.amount):-Number(x.amount)),0))}</h2><small>lançamentos atuais</small></div><div className="financeHeroRight"><div><span>A receber</span><b>{money(financeEntries.filter((x:any)=>x.entry_type==='receivable'&&!x.paid_at).reduce((a:any,x:any)=>a+Number(x.amount),0))}</b></div><div><span>A pagar</span><b>{money(financeEntries.filter((x:any)=>x.entry_type==='payable'&&!x.paid_at).reduce((a:any,x:any)=>a+Number(x.amount),0))}</b></div></div></div>
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

    {selected && section==='services' && <div className="drawerOverlay" onClick={()=>setSelected(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">{selected.id}</span><h2>{selected.client}</h2><p className="subtitle">{selected.title}</p><div className="drawerValue">{money(selected.value)}<span>{selected.stage}</span></div><div className="timeline">{stages.map((st,i)=><div className={i<=stages.indexOf(selected.stage)?'done':''} key={st}><i></i><span>{st}</span></div>)}</div><div className="detailBlock"><h4>Resumo da OS</h4><div className="detailRow"><span>Entrega</span><b>{selected.due}</b></div><div className="detailRow"><span>Progresso</span><b>{selected.progress}%</b></div><div className="detailRow"><span>Responsável</span><b>Equipe Produção</b></div></div><div className="detailBlock"><h4>Orçamento</h4><div className="quoteForm"><input placeholder="Descrição do item" value={quoteItem.description} onChange={e=>setQuoteItem({...quoteItem,description:e.target.value})}/><div><input type="number" min="0" step="0.01" placeholder="Qtd." value={quoteItem.quantity} onChange={e=>setQuoteItem({...quoteItem,quantity:e.target.value})}/><select value={quoteItem.unit} onChange={e=>setQuoteItem({...quoteItem,unit:e.target.value})}><option>un</option><option>m²</option><option>m</option><option>h</option></select><input type="number" min="0" step="0.01" placeholder="Valor unit." value={quoteItem.unitPrice} onChange={e=>setQuoteItem({...quoteItem,unitPrice:e.target.value})}/></div><button className="action" onClick={addQuoteItem}>+ Adicionar ao orçamento</button></div>{quoteItems.map(x=><div className="quoteLine" key={x.id}><div><b>{x.description}</b><span>{Number(x.quantity)} {x.unit} × {money(Number(x.unit_price))}</span></div><strong>{money(Number(x.quantity)*Number(x.unit_price))}</strong><button onClick={()=>removeQuoteItem(x.id)}>×</button></div>)}</div><div className="detailBlock"><h4>Checklist de produção</h4>{tasks.length===0?<span className="taskHint">O checklist será criado automaticamente quando a OS for aprovada.</span>:tasks.map(t=><button className={'taskItem '+(t.status==='done'?'done':'')} key={t.id} onClick={()=>toggleTask(t.id,t.status)}><i>{t.status==='done'?'✓':''}</i><span>{t.title}</span></button>)}</div><div className="detailBlock"><h4>Próximas ações</h4><button className="action">▣ Materiais e estoque</button><button className="action">⌁ Arquivos e arte</button><button className="action">💬 Conversa com cliente</button></div><div className="drawerButtons"><button onClick={()=>moveStage(selected,-1)}>← Voltar etapa</button><button className="primary" onClick={()=>moveStage(selected,1)}>Avançar etapa →</button></div></aside></div>}

    {showNew && <div className="modalOverlay" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowNew(false)}>×</button><span className="eyebrow">NOVO SERVIÇO</span><h2>Comece pelo que o cliente pediu</h2><p>A OS seguirá do orçamento até a conclusão sem precisar ser recriada em outros módulos.</p><label>Cliente<select value={newService.clientId} onFocus={()=>{if(!clients.length)loadClients()}} onChange={e=>{const cl=clients.find(x=>x.id===e.target.value);setNewService({...newService,clientId:e.target.value,client:cl?.trade_name||cl?.name||''})}}><option value="">Selecione um cliente cadastrado</option>{clients.map(x=><option key={x.id} value={x.id}>{x.trade_name||x.name}{x.document?' — '+x.document:''}</option>)}</select></label><button className="ghost wide" onClick={()=>{setShowNew(false);setSection('clients');loadClients()}}>+ Cadastrar novo cliente</button><label>Serviço<input value={newService.title} onChange={e=>setNewService({...newService,title:e.target.value})} placeholder="Ex.: Fachada ACM + letra caixa"/></label><div className="two"><label>Valor estimado<input type="number" value={newService.total} onChange={e=>setNewService({...newService,total:e.target.value})} placeholder="0,00"/></label><label>Prazo<input type="date" value={newService.due} onChange={e=>setNewService({...newService,due:e.target.value})}/></label></div><button className="primary wide" onClick={createService}>Criar serviço</button></div></div>}
  </div>
}
