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
  estimatedCost?: number
  actualCost?: number
  estimatedMargin?: number
  minimumMargin?: number
  suggestedPrice?: number
  quoteValidUntil?: string
  paymentTerms?: string
  quoteNotes?: string
  discount?: number
  productionHours?: number
  installationHours?: number
  machineHours?: number
  travelKm?: number
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
  const [section,setSection]=useState<'services'|'clients'|'finance'|'catalog'|'stock'|'brand'>('services')
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
  const [clientEditId,setClientEditId]=useState('')
  const [clientForm,setClientForm]=useState({document:'',legalName:'',tradeName:'',stateRegistration:'',phone:'',email:'',postalCode:'',street:'',number:'',district:'',city:'',state:''})
  const [clientMsg,setClientMsg]=useState('')
  const [quoteItems,setQuoteItems]=useState<any[]>([])
  const [quoteItem,setQuoteItem]=useState({description:'',quantity:'1',unit:'un',unitPrice:''})
  const [financeEntries,setFinanceEntries]=useState<any[]>([])
  const [tasks,setTasks]=useState<any[]>([])
  const [materials,setMaterials]=useState<any[]>([])
  const [osMaterials,setOsMaterials]=useState<any[]>([])
  const [materialPick,setMaterialPick]=useState({materialId:'',quantity:'1'})
  const [materialForm,setMaterialForm]=useState({id:'',name:'',unit:'un',stockQuantity:'0',minStock:'0',unitCost:'0'})
  const [costInputs,setCostInputs]=useState({productionHours:'0',installationHours:'0',machineHours:'0',travelKm:'0'})
  const [pricing,setPricing]=useState({productionHourCost:'0',installationHourCost:'0',machineHourCost:'0',travelKmCost:'0',taxPercent:'0',commissionPercent:'0',wastePercent:'0',minimumMarginPercent:'0'})
  const [pricingMsg,setPricingMsg]=useState('')
  const [quoteDetails,setQuoteDetails]=useState({validUntil:'',paymentTerms:'',notes:'',discount:'0'})
  const [quoteMsg,setQuoteMsg]=useState('')
  const [catalog,setCatalog]=useState<any[]>([])
  const [catalogPick,setCatalogPick]=useState('')
  const [measure,setMeasure]=useState({width:'',height:'',quantity:'1'})
  const [catalogEdit,setCatalogEdit]=useState({id:'',basePrice:'0',productionHours:'0',installationHours:'0',machineHours:'0'})
  const [catalogMaterials,setCatalogMaterials]=useState<any[]>([])
  const [catalogMaterialForm,setCatalogMaterialForm]=useState({materialId:'',consumptionPerUnit:'1',wastePercent:'0'})

  useEffect(()=>{(async()=>{try{const r=await fetch('/api/services',{cache:'no-store'});if(!r.ok) throw new Error();const rows=await r.json();setDbStatus('online');if(rows.length){setServices(rows.map((x:any)=>({dbId:x.id,id:x.code,client:x.client||'Cliente',title:x.title,value:Number(x.total),stage:x.stage as Stage,due:x.due_date?new Date(x.due_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'—',progress:Math.round(((stages.indexOf(x.stage as Stage)+1)/stages.length)*100),color:'#3157ff',estimatedCost:Number(x.estimated_cost||0),actualCost:Number(x.actual_cost||0),estimatedMargin:Number(x.estimated_margin||0),minimumMargin:Number(x.minimum_margin||0),suggestedPrice:Number(x.suggested_price||0),quoteValidUntil:x.quote_valid_until||'',paymentTerms:x.payment_terms||'',quoteNotes:x.quote_notes||'',discount:Number(x.discount||0),productionHours:Number(x.production_hours||0),installationHours:Number(x.installation_hours||0),machineHours:Number(x.machine_hours||0),travelKm:Number(x.travel_km||0)})));setSelected(null)}}catch{setDbStatus('offline')}})()},[])

  async function loadCatalog(){const r=await fetch('/api/catalog',{cache:'no-store'});if(r.ok)setCatalog(await r.json())}
  async function loadCatalogMaterials(id:string){const r=await fetch('/api/catalog-materials?catalogId='+id,{cache:'no-store'});if(r.ok)setCatalogMaterials(await r.json())}
  async function addCatalogMaterial(){if(!catalogEdit.id||!catalogMaterialForm.materialId)return;const r=await fetch('/api/catalog-materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({catalogId:catalogEdit.id,...catalogMaterialForm})});if(r.ok){setCatalogMaterialForm({materialId:'',consumptionPerUnit:'1',wastePercent:'0'});await loadCatalogMaterials(catalogEdit.id)}}
  async function removeCatalogMaterial(id:string){if(!catalogEdit.id)return;const r=await fetch('/api/catalog-materials',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(r.ok)await loadCatalogMaterials(catalogEdit.id)}
  async function saveCatalogEdit(){if(!catalogEdit.id)return;const r=await fetch('/api/catalog',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(catalogEdit)});if(r.ok){await loadCatalog();setCatalogEdit({id:'',basePrice:'0',productionHours:'0',installationHours:'0',machineHours:'0'})}}
  async function loadPricing(){const r=await fetch('/api/pricing-settings',{cache:'no-store'});if(r.ok){const x=await r.json();setPricing({productionHourCost:String(x.production_hour_cost||0),installationHourCost:String(x.installation_hour_cost||0),machineHourCost:String(x.machine_hour_cost||0),travelKmCost:String(x.travel_km_cost||0),taxPercent:String(x.tax_percent||0),commissionPercent:String(x.commission_percent||0),wastePercent:String(x.waste_percent||0),minimumMarginPercent:String(x.minimum_margin_percent||0)})}}
  async function savePricing(){setPricingMsg('Salvando...');const r=await fetch('/api/pricing-settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(pricing)});setPricingMsg(r.ok?'Parâmetros salvos com sucesso.':'Erro ao salvar parâmetros.')}
  async function loadFinance(){const r=await fetch('/api/finance',{cache:'no-store'});if(r.ok)setFinanceEntries(await r.json())}
  async function toggleFinance(id:string,status:string){const r=await fetch('/api/finance',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:status==='paid'?'pending':'paid'})});if(r.ok)await loadFinance()}
  async function loadClients(){const r=await fetch('/api/clients',{cache:'no-store'});if(r.ok)setClients(await r.json())}
  async function lookupCnpj(){setClientMsg('Consultando CNPJ...');const clean=clientForm.document.replace(/\D/g,'');const r=await fetch('/api/cnpj/'+clean);const x=await r.json();if(!r.ok){setClientMsg(x.error||'Não foi possível consultar');return}setClientForm({...clientForm,...x,document:clean});setClientMsg('Dados encontrados. Confira e salve o cliente.')}
  async function saveClient(){const editing=!!clientEditId;const r=await fetch('/api/clients',{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...clientForm,id:clientEditId||undefined,personType:'PJ'})});const x=await r.json();if(!r.ok){setClientMsg(x.error||'Erro ao salvar');return}setClientMsg(editing?'Cliente atualizado com sucesso.':'Cliente cadastrado com sucesso.');setClientEditId('');setClientForm({document:'',legalName:'',tradeName:'',stateRegistration:'',phone:'',email:'',postalCode:'',street:'',number:'',district:'',city:'',state:''});await loadClients()}

  async function createService(){
    if(!newService.clientId||!newService.title.trim()) return
    const r=await fetch('/api/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newService)})
    if(!r.ok){setDbStatus('offline');return}
    const x=await r.json(); const item:Service={dbId:x.id,id:x.code,client:x.client,title:x.title,value:Number(x.total),stage:x.stage,due:x.due_date?new Date(x.due_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'—',progress:14,color:'#3157ff',estimatedCost:Number(x.estimated_cost||0),actualCost:Number(x.actual_cost||0),estimatedMargin:Number(x.estimated_margin||0),minimumMargin:Number(x.minimum_margin||0),suggestedPrice:Number(x.suggested_price||0)}
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

  async function shareQuoteWhatsApp(){if(!selected?.dbId)return;const r=await fetch('/api/quote-share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selected.dbId})});const x=await r.json();if(!r.ok){setQuoteMsg(x.error||'Erro ao gerar link.');return}const msg='Olá! Segue o orçamento '+selected.id+' referente a '+selected.title+'. Valor: '+money(selected.value)+'. Veja os detalhes e aprove pelo link: '+x.url;window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank')}
  async function saveQuoteDetails(){if(!selected?.dbId)return;setQuoteMsg('Salvando...');const r=await fetch('/api/services',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selected.dbId,quoteDetails})});if(r.ok){const x=await r.json();const value=Number(x.total||0),discount=Number(x.discount||0);setServices(p=>p.map(s=>s.dbId===selected.dbId?{...s,value,discount}:s));setSelected({...selected,value,discount});setQuoteMsg('Condições salvas.')}else setQuoteMsg('Erro ao salvar.')}
  async function saveCosts(){if(!selected?.dbId)return;const r=await fetch('/api/services',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selected.dbId,costInputs})});if(r.ok){const x=await r.json();const estimatedCost=Number(x.estimated_cost||0);setServices(p=>p.map(s=>s.dbId===selected.dbId?{...s,estimatedCost}:s));setSelected({...selected,estimatedCost})}}
  async function saveMaterial(){if(!materialForm.name.trim())return;const editing=!!materialForm.id;const r=await fetch('/api/materials',{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(materialForm)});if(r.ok){setMaterialForm({id:'',name:'',unit:'un',stockQuantity:'0',minStock:'0',unitCost:'0'});await loadMaterials()}}
  async function loadMaterials(s?:Service){const all=await fetch('/api/materials',{cache:'no-store'});if(all.ok)setMaterials(await all.json());if(s?.dbId){const r=await fetch('/api/materials?workOrderId='+s.dbId,{cache:'no-store'});if(r.ok)setOsMaterials(await r.json())}}
  async function addMaterial(){if(!selected?.dbId||!materialPick.materialId)return;const r=await fetch('/api/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workOrderId:selected.dbId,...materialPick})});if(r.ok){setMaterialPick({materialId:'',quantity:'1'});await loadMaterials(selected)}}
  async function loadTasks(s:Service){if(!s.dbId){setTasks([]);return}const r=await fetch('/api/tasks?workOrderId='+s.dbId,{cache:'no-store'});if(r.ok)setTasks(await r.json())}
  async function toggleTask(id:string,status:string){const r=await fetch('/api/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:status==='done'?'pending':'done'})});if(r.ok&&selected)await loadTasks(selected)}
  async function loadQuoteItems(s:Service){if(!s.dbId){setQuoteItems([]);return}const r=await fetch('/api/quote-items?workOrderId='+s.dbId,{cache:'no-store'});if(r.ok)setQuoteItems(await r.json())}
  async function addQuoteItem(){if(!selected?.dbId||!quoteItem.description.trim())return;const r=await fetch('/api/quote-items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workOrderId:selected.dbId,...quoteItem,catalogId:catalogPick||undefined})});if(r.ok){setQuoteItem({description:'',quantity:'1',unit:'un',unitPrice:''});setCatalogPick('');await loadQuoteItems(selected);await loadMaterials(selected);const total=quoteItems.reduce((a:any,x:any)=>a+Number(x.quantity)*Number(x.unit_price),0);void total;const sr=await fetch('/api/services',{cache:'no-store'});if(sr.ok){const rows=await sr.json();const row=rows.find((x:any)=>x.id===selected.dbId);if(row){const value=Number(row.total);setServices(p=>p.map(x=>x.dbId===selected.dbId?{...x,value}:x));setSelected({...selected,value})}}}}
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
        <button className={section==='finance'?'active':''} onClick={()=>{setSection('finance');loadFinance()}}>$ <span>Financeiro</span></button><button className={section==='catalog'?'active':''} onClick={()=>{setSection('catalog');loadCatalog()}}>▤ <span>Catálogo</span></button><button className={section==='stock'?'active':''} onClick={()=>{setSection('stock');loadMaterials()}}>▥ <span>Estoque</span></button>
      </nav>
      <div className="sidebarBottom">
        <button className={section==='brand'?'active':''} onClick={()=>{setSection('brand');loadPricing()}}>⚙ <span>Personalização</span></button>
        <div className="user"><div className="avatar">IM</div><div><b>Administrador</b><small>Empresa demo</small></div></div>
      </div>
    </aside>

    <main>
      <header><div><h1>{section==='services'?'Central de Serviços':section==='clients'?'Clientes':section==='finance'?'Financeiro':section==='catalog'?'Catálogo de Serviços':section==='stock'?'Estoque':'Personalização da Empresa'}</h1><p>{section==='services'?'Do primeiro atendimento à entrega, tudo no mesmo lugar.':section==='clients'?'Cadastre empresas e use os dados diretamente nos orçamentos e OS.':section==='finance'?'Caixa, contas, recebimentos e resultado.':'Deixe o sistema com a cara de cada cliente.'} {section==='services'&&<small style={{marginLeft:8}}>Banco: {dbStatus==='online'?'● online':dbStatus==='offline'?'● offline':'conectando...'}</small>}</p></div><div className="headerActions"><button className="ghost">⌕ Pesquisar</button>{section==='services'&&<button className="primary" onClick={()=>setShowNew(true)}>+ Novo serviço</button>}</div></header>

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
          <div className="kanbanList">{boardServices.filter(x=>x.stage===stage).map(s=><article draggable className={'serviceCard kanbanCard '+(dragging===s.id?'dragging':'')} key={s.id} onDragStart={e=>{setDragging(s.id);e.dataTransfer.setData('text/plain',s.id);e.dataTransfer.effectAllowed='move'}} onDragEnd={()=>setDragging(null)} onClick={()=>{setSelected(s);setQuoteDetails({validUntil:s.quoteValidUntil||'',paymentTerms:s.paymentTerms||'',notes:s.quoteNotes||'',discount:String(s.discount||0)});setCostInputs({productionHours:String(s.productionHours||0),installationHours:String(s.installationHours||0),machineHours:String(s.machineHours||0),travelKm:String(s.travelKm||0)});loadQuoteItems(s);loadTasks(s);loadMaterials(s)}}>
            <div className="cardTop"><span className="os">{s.id}</span><span className="dragHandle" title="Arraste para outra etapa">⋮⋮</span></div>
            <h3>{s.client}</h3><p>{s.title}</p>
            <div className="cardMeta"><span>Entrega <b>{s.due}</b></span><strong>{money(s.value)}</strong></div>
            <div className="progress"><i style={{width:`${s.progress}%`,background:s.color}}/></div>
            <div className="cardFoot"><span>{s.progress}%</span><span>Detalhes →</span></div>
          </article>)}
          {!boardServices.some(x=>x.stage===stage)&&<div className="emptyStage">Arraste uma OS para cá</div>}</div>
        </div>)}</section>
      </>}

      {section==='stock' && <section className="stockPage"><div className="panel"><div className="panelTitle"><div><h3>Materiais e estoque</h3><p>Custos, estoque atual e nível mínimo.</p></div><button onClick={()=>setMaterialForm({id:'',name:'',unit:'un',stockQuantity:'0',minStock:'0',unitCost:'0'})}>+ Novo</button></div>{materials.length===0?<div className="emptyClients">Nenhum material cadastrado.</div>:materials.map((m:any)=><button className="stockRow" key={m.id} onClick={()=>setMaterialForm({id:m.id,name:m.name,unit:m.unit,stockQuantity:String(m.stock_quantity||0),minStock:String(m.min_stock||0),unitCost:String(m.unit_cost||0)})}><span><b>{m.name}</b><small>{m.unit} · custo {money(Number(m.unit_cost||0))}</small></span><strong className={Number(m.stock_quantity)<=Number(m.min_stock)?'stockLow':''}>{Number(m.stock_quantity)} {m.unit}</strong></button>)}</div><div className="panel stockEditor"><h3>{materialForm.id?'Editar material':'Novo material'}</h3><label>Material<input value={materialForm.name} onChange={e=>setMaterialForm({...materialForm,name:e.target.value})}/></label><label>Unidade<input value={materialForm.unit} onChange={e=>setMaterialForm({...materialForm,unit:e.target.value})}/></label><label>Estoque atual<input type="number" min="0" step="0.001" value={materialForm.stockQuantity} onChange={e=>setMaterialForm({...materialForm,stockQuantity:e.target.value})}/></label><label>Estoque mínimo<input type="number" min="0" step="0.001" value={materialForm.minStock} onChange={e=>setMaterialForm({...materialForm,minStock:e.target.value})}/></label><label>Custo unitário<input type="number" min="0" step="0.01" value={materialForm.unitCost} onChange={e=>setMaterialForm({...materialForm,unitCost:e.target.value})}/></label><button className="primary wide" onClick={saveMaterial}>Salvar material</button></div></section>}

      {section==='catalog' && <section className="catalogPage"><div className="panel"><div className="panelTitle"><div><h3>Catálogo de serviços</h3><p>Configure preço-base e tempos padrão usados automaticamente nos orçamentos.</p></div></div><div className="catalogTable">{catalog.map((x:any)=><button key={x.id} className="catalogRow" onClick={()=>{setCatalogEdit({id:x.id,basePrice:String(x.base_price||0),productionHours:String(x.production_hours_per_unit||0),installationHours:String(x.installation_hours_per_unit||0),machineHours:String(x.machine_hours_per_unit||0)});loadMaterials();loadCatalogMaterials(x.id)}}><span><b>{x.name}</b><small>{x.category} · {x.unit}</small></span><strong>{money(Number(x.base_price||0))}</strong></button>)}</div></div>{catalogEdit.id&&<div className="panel catalogEditor"><h3>Configurar serviço</h3><label>Preço-base<input type="number" min="0" step="0.01" value={catalogEdit.basePrice} onChange={e=>setCatalogEdit({...catalogEdit,basePrice:e.target.value})}/></label><label>Horas de produção por unidade<input type="number" min="0" step="0.1" value={catalogEdit.productionHours} onChange={e=>setCatalogEdit({...catalogEdit,productionHours:e.target.value})}/></label><label>Horas de instalação por unidade<input type="number" min="0" step="0.1" value={catalogEdit.installationHours} onChange={e=>setCatalogEdit({...catalogEdit,installationHours:e.target.value})}/></label><label>Horas de máquina por unidade<input type="number" min="0" step="0.1" value={catalogEdit.machineHours} onChange={e=>setCatalogEdit({...catalogEdit,machineHours:e.target.value})}/></label><button className="primary wide" onClick={saveCatalogEdit}>Salvar ficha técnica</button><div className="catalogMaterialEditor"><h4>Materiais da ficha técnica</h4><div className="catalogMaterialForm"><select value={catalogMaterialForm.materialId} onChange={e=>setCatalogMaterialForm({...catalogMaterialForm,materialId:e.target.value})}><option value="">Selecionar material</option>{materials.map(m=><option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select><input type="number" min="0" step="0.001" value={catalogMaterialForm.consumptionPerUnit} onChange={e=>setCatalogMaterialForm({...catalogMaterialForm,consumptionPerUnit:e.target.value})} placeholder="Consumo/un."/><input type="number" min="0" step="0.1" value={catalogMaterialForm.wastePercent} onChange={e=>setCatalogMaterialForm({...catalogMaterialForm,wastePercent:e.target.value})} placeholder="Perda %"/><button className="action" onClick={addCatalogMaterial}>+ Vincular material</button></div>{catalogMaterials.length===0?<small>Nenhum material configurado.</small>:catalogMaterials.map(m=><div className="catalogMaterialLine" key={m.id}><span><b>{m.material}</b><small>{Number(m.consumption_per_unit)} {m.unit}/un. · perda {Number(m.waste_percent)}%</small></span><button onClick={()=>removeCatalogMaterial(m.id)}>×</button></div>)}</div></div>}</section>}

      {section==='clients' && <section className="clientPage">
        <div className="panel clientEditor"><div className="panelTitle"><div><h3>Novo cliente</h3><p>Digite o CNPJ para preencher os dados disponíveis automaticamente.</p></div></div>
          <div className="cnpjRow"><label>CNPJ<input value={clientForm.document} onChange={e=>setClientForm({...clientForm,document:e.target.value})} placeholder="00.000.000/0000-00"/></label><button className="primary" onClick={lookupCnpj}>Consultar CNPJ</button></div>
          {clientMsg&&<div className="clientMsg">{clientMsg}</div>}
          <div className="clientGrid"><label>Razão social<input value={clientForm.legalName} onChange={e=>setClientForm({...clientForm,legalName:e.target.value})}/></label><label>Nome fantasia<input value={clientForm.tradeName} onChange={e=>setClientForm({...clientForm,tradeName:e.target.value})}/></label><label>Inscrição Estadual<input value={clientForm.stateRegistration} onChange={e=>setClientForm({...clientForm,stateRegistration:e.target.value})} placeholder="Preencher/confirmar"/></label><label>Telefone<input value={clientForm.phone} onChange={e=>setClientForm({...clientForm,phone:e.target.value})}/></label><label>E-mail<input value={clientForm.email} onChange={e=>setClientForm({...clientForm,email:e.target.value})}/></label><label>CEP<input value={clientForm.postalCode} onChange={e=>setClientForm({...clientForm,postalCode:e.target.value})}/></label><label className="wideField">Endereço<input value={clientForm.street} onChange={e=>setClientForm({...clientForm,street:e.target.value})}/></label><label>Número<input value={clientForm.number} onChange={e=>setClientForm({...clientForm,number:e.target.value})}/></label><label>Bairro<input value={clientForm.district} onChange={e=>setClientForm({...clientForm,district:e.target.value})}/></label><label>Cidade<input value={clientForm.city} onChange={e=>setClientForm({...clientForm,city:e.target.value})}/></label><label>UF<input maxLength={2} value={clientForm.state} onChange={e=>setClientForm({...clientForm,state:e.target.value.toUpperCase()})}/></label></div>
          <button className="primary wide" onClick={saveClient}>Salvar cliente</button>
        </div>
        <div className="panel"><div className="panelTitle"><div><h3>Clientes cadastrados</h3><p>{clients.length} cliente(s)</p></div><button onClick={loadClients}>Atualizar</button></div>{clients.length===0?<div className="emptyClients">Nenhum cliente cadastrado ainda.</div>:clients.map(x=><button className="clientRow clientRowButton" key={x.id} onClick={()=>{setClientEditId(x.id);setClientForm({document:x.document||'',legalName:x.legal_name||'',tradeName:x.trade_name||x.name||'',stateRegistration:x.state_registration||'',phone:x.phone||'',email:x.email||'',postalCode:x.postal_code||'',street:x.street||'',number:x.address_number||'',district:x.district||'',city:x.city||'',state:x.state||''});setClientMsg('Editando cliente.')}}><div><b>{x.trade_name||x.name}</b><span>{x.legal_name||''}</span></div><div><b>{x.document||'Sem documento'}</b><span>{[x.city,x.state].filter(Boolean).join(' / ')}</span></div></button>)}</div>
      </section>}

      {section==='finance' && <section className="financePage">
        <div className="financeHero"><div><span>Saldo projetado</span><h2>{money(financeEntries.filter((x:any)=>x.status!=='paid').reduce((a:any,x:any)=>a+(x.entry_type==='receivable'?Number(x.amount):-Number(x.amount)),0))}</h2><small>lançamentos pendentes</small></div><div className="financeHeroRight"><div><span>A receber</span><b>{money(financeEntries.filter((x:any)=>x.entry_type==='receivable'&&x.status!=='paid').reduce((a:any,x:any)=>a+Number(x.amount),0))}</b></div><div><span>Recebido</span><b>{money(financeEntries.filter((x:any)=>x.entry_type==='receivable'&&x.status==='paid').reduce((a:any,x:any)=>a+Number(x.amount),0))}</b></div></div></div>
        <div className="financeCards"><div><span>Pendentes</span><b>{financeEntries.filter((x:any)=>x.status!=='paid').length}</b><small>lançamentos em aberto</small></div><div><span>Recebidos</span><b>{financeEntries.filter((x:any)=>x.status==='paid').length}</b><small>baixas realizadas</small></div><div><span>Total lançado</span><b>{money(financeEntries.reduce((a:any,x:any)=>a+Number(x.amount),0))}</b><small>movimentação registrada</small></div><div><span>OS vinculadas</span><b>{new Set(financeEntries.filter((x:any)=>x.work_order_id).map((x:any)=>x.work_order_id)).size}</b><small>serviços no financeiro</small></div></div>
        <div className="panel"><div className="panelTitle"><h3>Movimentações</h3><button onClick={loadFinance}>Atualizar</button></div>{financeEntries.length===0?<div className="emptyClients">Nenhum lançamento financeiro.</div>:financeEntries.map((x:any)=><div className="transaction" key={x.id}><div className="txIcon">{x.entry_type==='receivable'?'↓':'↑'}</div><div><b>{x.code||'Lançamento'}</b><span>{x.description}</span></div><strong className={x.entry_type==='receivable'?'positive':'negative'}>{x.entry_type==='receivable'?'+ ':'- '}{money(Number(x.amount))}</strong><button className={'financeStatus '+(x.status==='paid'?'paid':'')} onClick={()=>toggleFinance(x.id,x.status)}>{x.status==='paid'?'Recebido':'Dar baixa'}</button></div>)}</div>
      </section>}

      {section==='brand' && <section className="pricingPanel panel"><div className="panelTitle"><div><h3>Precificação da empresa</h3><p>Estes valores serão usados automaticamente para calcular o custo e a margem das ordens de serviço.</p></div></div><div className="pricingGrid">{[['productionHourCost','Produção / hora (R$)'],['installationHourCost','Instalação / hora (R$)'],['machineHourCost','Máquina / hora (R$)'],['travelKmCost','Deslocamento / km (R$)'],['taxPercent','Impostos (%)'],['commissionPercent','Comissão (%)'],['wastePercent','Desperdício (%)'],['minimumMarginPercent','Margem mínima (%)']].map(([k,label])=><label key={k}>{label}<input type="number" min="0" step="0.01" value={(pricing as any)[k]} onChange={e=>setPricing({...pricing,[k]:e.target.value})}/></label>)}</div><button className="primary" onClick={savePricing}>Salvar parâmetros de precificação</button>{pricingMsg&&<span className="pricingMsg">{pricingMsg}</span>}</section>}

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

    {selected && section==='services' && <div className="drawerOverlay" onClick={()=>setSelected(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">{selected.id}</span><h2>{selected.client}</h2><p className="subtitle">{selected.title}</p><div className="drawerValue">{money(selected.value)}<span>{selected.stage}</span></div><div className="timeline">{stages.map((st,i)=><div className={i<=stages.indexOf(selected.stage)?'done':''} key={st}><i></i><span>{st}</span></div>)}</div>{selected.value>0&&(selected.estimatedMargin||0)<(selected.minimumMargin||0)&&<div className="marginAlert"><b>⚠ Margem abaixo do mínimo</b><span>Margem atual: {(selected.estimatedMargin||0).toFixed(1)}% · Mínimo configurado: {(selected.minimumMargin||0).toFixed(1)}%</span><strong>Preço sugerido: {money(selected.suggestedPrice||0)}</strong></div>}<div className="quoteCommercial"><h4>Condições comerciais</h4><div><label>Validade<input type="date" value={quoteDetails.validUntil} onChange={e=>setQuoteDetails({...quoteDetails,validUntil:e.target.value})}/></label><label>Desconto (R$)<input type="number" min="0" step="0.01" value={quoteDetails.discount} onChange={e=>setQuoteDetails({...quoteDetails,discount:e.target.value})}/></label></div><label>Condição de pagamento<input placeholder="Ex.: 50% entrada + 50% na instalação" value={quoteDetails.paymentTerms} onChange={e=>setQuoteDetails({...quoteDetails,paymentTerms:e.target.value})}/></label><label>Observações<textarea rows={3} value={quoteDetails.notes} onChange={e=>setQuoteDetails({...quoteDetails,notes:e.target.value})}/></label><button className="action" onClick={saveQuoteDetails}>Salvar condições</button><button className="action" onClick={()=>selected?.dbId&&window.open('/api/quote-print?id='+selected.dbId,'_blank')}>Gerar / imprimir PDF</button><button className="action whatsappAction" onClick={shareQuoteWhatsApp}>Enviar pelo WhatsApp</button>{quoteMsg&&<span className="quoteMsg">{quoteMsg}</span>}</div><div className="costInputs"><h4>Custos operacionais</h4><div><label>Produção (h)<input type="number" min="0" step="0.25" value={costInputs.productionHours} onChange={e=>setCostInputs({...costInputs,productionHours:e.target.value})}/></label><label>Instalação (h)<input type="number" min="0" step="0.25" value={costInputs.installationHours} onChange={e=>setCostInputs({...costInputs,installationHours:e.target.value})}/></label><label>Máquina (h)<input type="number" min="0" step="0.25" value={costInputs.machineHours} onChange={e=>setCostInputs({...costInputs,machineHours:e.target.value})}/></label><label>Deslocamento (km)<input type="number" min="0" step="1" value={costInputs.travelKm} onChange={e=>setCostInputs({...costInputs,travelKm:e.target.value})}/></label></div><button className="action" onClick={saveCosts}>Recalcular custos</button></div><div className="resultBox"><div><span>Venda</span><b>{money(selected.value)}</b></div><div><span>Custo estimado</span><b>{money(selected.estimatedCost||0)}</b></div><div><span>Resultado estimado</span><b>{money(selected.value-(selected.estimatedCost||0))}</b></div><div><span>Margem estimada</span><b>{selected.value>0?(((selected.value-(selected.estimatedCost||0))/selected.value)*100).toFixed(1):'0.0'}%</b></div></div><div className="detailBlock"><h4>Resumo da OS</h4><div className="detailRow"><span>Entrega</span><b>{selected.due}</b></div><div className="detailRow"><span>Progresso</span><b>{selected.progress}%</b></div><div className="detailRow"><span>Responsável</span><b>Equipe Produção</b></div></div><div className="detailBlock"><h4>Orçamento</h4><div className="catalogQuick"><select value={catalogPick} onFocus={loadCatalog} onChange={e=>{const id=e.target.value;setCatalogPick(id);const x=catalog.find((i:any)=>i.id===id);if(x){setQuoteItem({description:x.name,quantity:'1',unit:x.unit||'un',unitPrice:String(x.base_price||'')});setMeasure({width:'',height:'',quantity:'1'})}}}><option value="">Adicionar item do catálogo...</option>{catalog.map((x:any)=><option key={x.id} value={x.id}>{x.category} — {x.name}</option>)}</select></div>{(()=>{const x=catalog.find((i:any)=>i.id===catalogPick);if(!x)return null;const area=x.formula_type==='area';return <div className="measureBox"><b>Cálculo rápido</b><div>{area&&<><label>Largura (m)<input type="number" min="0" step="0.01" value={measure.width} onChange={e=>setMeasure({...measure,width:e.target.value})}/></label><label>Altura (m)<input type="number" min="0" step="0.01" value={measure.height} onChange={e=>setMeasure({...measure,height:e.target.value})}/></label></>}<label>Quantidade<input type="number" min="0.01" step="0.01" value={measure.quantity} onChange={e=>setMeasure({...measure,quantity:e.target.value})}/></label></div><button className="action" onClick={()=>{const q=Math.max(Number(measure.quantity)||1,0.01);const computed=area?Math.max((Number(measure.width)||0)*(Number(measure.height)||0)*q,0):q;setQuoteItem({...quoteItem,quantity:String(Number(computed.toFixed(3))),unit:x.unit||quoteItem.unit})}}>Aplicar cálculo {area?'de m²':''}</button>{area&&Number(measure.width)>0&&Number(measure.height)>0&&<span>{Number(measure.width)*Number(measure.height)*Math.max(Number(measure.quantity)||1,0.01)} m²</span>}</div>})()}<div className="quoteForm"><input placeholder="Descrição do item" value={quoteItem.description} onChange={e=>setQuoteItem({...quoteItem,description:e.target.value})}/><div><input type="number" min="0" step="0.01" placeholder="Qtd." value={quoteItem.quantity} onChange={e=>setQuoteItem({...quoteItem,quantity:e.target.value})}/><select value={quoteItem.unit} onChange={e=>setQuoteItem({...quoteItem,unit:e.target.value})}><option>un</option><option>m²</option><option>m</option><option>h</option></select><input type="number" min="0" step="0.01" placeholder="Valor unit." value={quoteItem.unitPrice} onChange={e=>setQuoteItem({...quoteItem,unitPrice:e.target.value})}/></div><button className="action" onClick={addQuoteItem}>+ Adicionar ao orçamento</button></div>{quoteItems.map(x=><div className="quoteLine" key={x.id}><div><b>{x.description}</b><span>{Number(x.quantity)} {x.unit} × {money(Number(x.unit_price))}</span></div><strong>{money(Number(x.quantity)*Number(x.unit_price))}</strong><button onClick={()=>removeQuoteItem(x.id)}>×</button></div>)}</div><div className="detailBlock"><h4>Materiais e estoque</h4><div className="materialAdd"><select value={materialPick.materialId} onChange={e=>setMaterialPick({...materialPick,materialId:e.target.value})}><option value="">Selecionar material</option>{materials.map(m=><option value={m.id} key={m.id}>{m.name} — estoque {Number(m.stock_quantity)} {m.unit}</option>)}</select><input type="number" min="0" step="0.01" value={materialPick.quantity} onChange={e=>setMaterialPick({...materialPick,quantity:e.target.value})}/><button onClick={addMaterial}>+</button></div>{osMaterials.length===0?<span className="taskHint">Nenhum material vinculado à OS.</span>:osMaterials.map(m=>{const shortage=Number(m.stock_quantity)<Number(m.quantity);return <div className={'materialLine '+(shortage?'shortage':'')} key={m.id}><div><b>{m.name}</b><span>Necessário: {Number(m.quantity)} {m.unit} · Estoque: {Number(m.stock_quantity)} {m.unit}</span></div><strong>{shortage?'COMPRAR MATERIAL':'DISPONÍVEL'}</strong></div>})}</div><div className="detailBlock"><h4>Checklist de produção</h4>{tasks.length===0?<span className="taskHint">O checklist será criado automaticamente quando a OS for aprovada.</span>:tasks.map(t=><button className={'taskItem '+(t.status==='done'?'done':'')} key={t.id} onClick={()=>toggleTask(t.id,t.status)}><i>{t.status==='done'?'✓':''}</i><span>{t.title}</span></button>)}</div><div className="detailBlock"><h4>Próximas ações</h4><button className="action">▣ Materiais e estoque</button><button className="action">⌁ Arquivos e arte</button><button className="action">💬 Conversa com cliente</button></div><div className="drawerButtons"><button onClick={()=>moveStage(selected,-1)}>← Voltar etapa</button><button className="primary" onClick={()=>moveStage(selected,1)}>Avançar etapa →</button></div></aside></div>}

    {showNew && <div className="modalOverlay" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowNew(false)}>×</button><span className="eyebrow">NOVO SERVIÇO</span><h2>Comece pelo que o cliente pediu</h2><p>A OS seguirá do orçamento até a conclusão sem precisar ser recriada em outros módulos.</p><label>Cliente<select value={newService.clientId} onFocus={()=>{if(!clients.length)loadClients()}} onChange={e=>{const cl=clients.find(x=>x.id===e.target.value);setNewService({...newService,clientId:e.target.value,client:cl?.trade_name||cl?.name||''})}}><option value="">Selecione um cliente cadastrado</option>{clients.map(x=><option key={x.id} value={x.id}>{x.trade_name||x.name}{x.document?' — '+x.document:''}</option>)}</select></label><button className="ghost wide" onClick={()=>{setShowNew(false);setSection('clients');loadClients()}}>+ Cadastrar novo cliente</button><label>Serviço<input value={newService.title} onChange={e=>setNewService({...newService,title:e.target.value})} placeholder="Ex.: Fachada ACM + letra caixa"/></label><div className="two"><label>Valor estimado<input type="number" value={newService.total} onChange={e=>setNewService({...newService,total:e.target.value})} placeholder="0,00"/></label><label>Prazo<input type="date" value={newService.due} onChange={e=>setNewService({...newService,due:e.target.value})}/></label></div><button className="primary wide" onClick={createService}>Criar serviço</button></div></div>}
  </div>
}
