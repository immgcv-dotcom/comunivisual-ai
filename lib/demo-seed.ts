type Sql=any

export async function seedDemoData(sql:Sql,companyId:string){
 const existing=await sql`select id from work_orders where company_id=${companyId} and code like 'DEMO-%' limit 1`
 if(existing.length)return

 const clients=[
  ['DEMO · Padaria Pão & Arte','17999910001','contato@paoearte.demo'],
  ['DEMO · Clínica Sorriso','17999910002','recepcao@sorriso.demo'],
  ['DEMO · Academia Movimento','17999910003','financeiro@movimento.demo'],
  ['DEMO · Auto Center Avenida','17999910004','contato@autocenter.demo'],
  ['DEMO · Restaurante Villa','17999910005','administrativo@villa.demo'],
  ['DEMO · Construtora Horizonte','17999910006','compras@horizonte.demo'],
  ['DEMO · Colégio Evolução','17999910007','secretaria@evolucao.demo'],
  ['DEMO · Boutique Aurora','17999910008','loja@aurora.demo']
 ]
 const clientIds:string[]=[]
 for(const [name,phone,email] of clients){
  const r=await sql`insert into clients(company_id,name,person_type,phone,whatsapp,email,city,state) values(${companyId},${name},'PJ',${phone},${phone},${email},'São José do Rio Preto','SP') returning id`
  clientIds.push(String(r[0].id))
 }

 const materials=[
  ['DEMO · Lona frontlight 440g','m²',180,35,18.9],
  ['DEMO · Adesivo vinil branco','m²',125,25,14.5],
  ['DEMO · Adesivo transparente','m²',48,12,19.8],
  ['DEMO · PVC expandido 3mm','m²',42,10,39.9],
  ['DEMO · ACM 3mm branco','m²',31,8,89],
  ['DEMO · Chapa PS 2mm','m²',24,6,46],
  ['DEMO · Perfil metalon 20x20','m',96,20,12.7],
  ['DEMO · Tinta solvente','l',18,5,78],
  ['DEMO · Ilhós nº 0','un',850,200,.18],
  ['DEMO · Fita dupla face VHB','m',62,15,7.4]
 ]
 const materialIds:string[]=[]
 for(const [name,unit,stock,min,cost] of materials){
  const r=await sql`insert into materials(company_id,name,unit,stock_quantity,min_stock,unit_cost) values(${companyId},${name},${unit},${stock},${min},${cost}) on conflict(company_id,name) do update set stock_quantity=excluded.stock_quantity,min_stock=excluded.min_stock,unit_cost=excluded.unit_cost returning id`
  materialIds.push(String(r[0].id))
 }

 const catalog=[
  ['Fachadas','DEMO · Fachada em ACM','m²',690],
  ['Adesivos','DEMO · Adesivação de vitrine','m²',145],
  ['Banners','DEMO · Banner em lona 440g','m²',89],
  ['Placas','DEMO · Placa PVC 3mm','m²',165],
  ['Sinalização','DEMO · Placa de sinalização','un',78],
  ['Impressão','DEMO · Adesivo impresso e recortado','m²',118]
 ]
 for(const [category,name,unit,price] of catalog)await sql`insert into service_catalog(company_id,category,name,unit,base_price,description,active) values(${companyId},${category},${name},${unit},${price},'Item demonstrativo para visualização do sistema',true) on conflict do nothing`

 const orders=[
  ['DEMO-001','Fachada nova - Padaria Pão & Arte','Atendimento',clientIds[0],0,0,7],
  ['DEMO-002','Adesivação completa de vitrine','Orçamento',clientIds[7],2860,1280,5],
  ['DEMO-003','Comunicação interna da clínica','Aprovado',clientIds[1],4780,2210,9],
  ['DEMO-004','Painel de recepção e placas','Arte',clientIds[5],8350,3920,12],
  ['DEMO-005','Fachada iluminada academia','Produção',clientIds[2],12490,6180,8],
  ['DEMO-006','Totem e sinalização externa','Produção',clientIds[3],6890,3150,6],
  ['DEMO-007','Adesivos e cardápios de parede','Instalação',clientIds[4],3970,1810,3],
  ['DEMO-008','Sinalização dos corredores','Concluído',clientIds[6],9650,4420,-4],
  ['DEMO-009','Placas promocionais coleção','Concluído',clientIds[7],3240,1490,-12],
  ['DEMO-010','Banner promocional campanha','Cancelado',clientIds[0],790,340,-2]
 ]
 for(let i=0;i<orders.length;i++){
  const [code,title,stage,clientId,total,cost,dueOffset]=orders[i] as any[]
  const r=await sql`insert into work_orders(company_id,client_id,code,title,description,stage,total,estimated_cost,actual_cost,due_date,quote_valid_until,payment_terms,quote_notes,production_hours,installation_hours,machine_hours,travel_km,installation_scheduled_at,installation_team,installation_address,installed_at,approved_at) values(${companyId},${clientId},${code},${title},'DEMO · Ordem de serviço criada para visualizar o aplicativo alimentado.',${stage},${total},${cost},${stage==='Concluído'?Number(cost)*1.04:0},current_date+${dueOffset}::int,current_date+7,'50% entrada + 50% na entrega','DEMO · Condições e observações ilustrativas.',${i+2},${i%3+1},${i%4},${i*3},${stage==='Instalação'?new Date(Date.now()+86400000).toISOString():null},${stage==='Instalação'?'Equipe Rafael + Bruno':null},${stage==='Instalação'?'Av. Brasil, 1250 - Centro':null},${stage==='Concluído'?new Date(Date.now()-86400000*3).toISOString():null},${['Aprovado','Arte','Produção','Instalação','Concluído'].includes(stage)?new Date(Date.now()-86400000*5).toISOString():null}) returning id`
  const id=String(r[0].id)
  if(Number(total)>0){
   const itemA=Number(total)*.62,itemB=Number(total)*.38
   await sql`insert into work_order_items(work_order_id,description,quantity,unit,unit_price) values(${id},'DEMO · Produção principal',1,'serviço',${itemA}),(${id},'DEMO · Acabamento e instalação',1,'serviço',${itemB})`
  }
  if(!['Atendimento','Orçamento','Cancelado'].includes(stage)){
   const tasks=[['Conferir medidas','Produção'],['Separar materiais','Produção'],['Conferir arte','Arte'],['Produzir serviço','Produção'],['Controle de qualidade','Qualidade'],['Liberar instalação','Instalação']]
   for(let t=0;t<tasks.length;t++){const done=stage==='Concluído'||stage==='Instalação'||(stage==='Produção'&&t<3);await sql`insert into work_order_tasks(work_order_id,title,task_type,status,sort_order,sector,responsible,estimated_minutes) values(${id},${'DEMO · '+tasks[t][0]},'production',${done?'done':t===0?'doing':'pending'},${t},${tasks[t][1]},${t%2?'Mariana':'Carlos'},${30+t*15}) on conflict do nothing`}
  }
  if(['Arte','Produção','Instalação','Concluído'].includes(stage))await sql`insert into artwork_versions(company_id,work_order_id,version_no,file_url,file_name,note,status,approved_at) values(${companyId},${id},1,'https://placehold.co/1200x800/png?text=ARTE+DEMO',${code+'-arte-v1.png'},'DEMO · Arte ilustrativa',${stage==='Arte'?'pending':'approved'},${stage==='Arte'?null:new Date(Date.now()-86400000*4).toISOString()})`
  if(Number(total)>0&&stage!=='Cancelado')await sql`insert into financial_entries(company_id,work_order_id,entry_type,description,amount,due_date,status,paid_at) values(${companyId},${id},'receivable',${'DEMO · Recebimento '+code},${total},current_date+${dueOffset}::int,${stage==='Concluído'?'paid':'pending'},${stage==='Concluído'?new Date(Date.now()-86400000*2).toISOString():null}) on conflict do nothing`
  if(['Produção','Instalação'].includes(stage)){
   const mid=materialIds[i%materialIds.length];await sql`insert into work_order_materials(work_order_id,material_id,quantity,reserved_quantity) values(${id},${mid},${4+i},${4+i}) on conflict do nothing`
  }
  await sql`insert into work_order_events(company_id,work_order_id,event_type,title,detail) values(${companyId},${id},'demo','DEMO · OS criada',${'Registro demonstrativo em '+stage})`
 }
 await sql`insert into financial_entries(company_id,entry_type,description,amount,due_date,status) values
 (${companyId},'payable','DEMO · Aluguel do galpão',4200,current_date+4,'pending'),
 (${companyId},'payable','DEMO · Energia elétrica',1380,current_date+8,'pending'),
 (${companyId},'payable','DEMO · Compra de materiais',6750,current_date-2,'paid'),
 (${companyId},'payable','DEMO · Manutenção de equipamentos',890,current_date+12,'pending')`
 await sql`insert into company_pricing_settings(company_id,production_hour_cost,installation_hour_cost,machine_hour_cost,travel_km_cost,tax_percent,commission_percent,waste_percent,minimum_margin_percent) values(${companyId},48,55,72,2.2,8,3,10,35) on conflict(company_id) do nothing`
}
