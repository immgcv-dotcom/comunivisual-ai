import { getDb } from './db'

async function ensureAuthSchema(sql:any){
 await sql`alter table companies add column if not exists status text not null default 'active'`
 await sql`alter table companies add column if not exists plan text not null default 'professional'`
 await sql`alter table companies add column if not exists user_limit int not null default 10`
 await sql`create table if not exists app_users (id uuid primary key default gen_random_uuid(),name text not null,email text not null,password_hash text not null,status text not null default 'active',is_super_admin boolean not null default false,failed_login_count int not null default 0,locked_until timestamptz,last_login_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`
 await sql`create unique index if not exists app_users_email_uidx on app_users(lower(email))`
 await sql`create table if not exists company_users (id uuid primary key default gen_random_uuid(),company_id uuid not null references companies(id) on delete cascade,user_id uuid not null references app_users(id) on delete cascade,role text not null default 'member',permissions text[] not null default '{}'::text[],active boolean not null default true,invited_by uuid references app_users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,user_id))`
 await sql`create table if not exists user_sessions (id uuid primary key default gen_random_uuid(),user_id uuid not null references app_users(id) on delete cascade,company_id uuid not null references companies(id) on delete cascade,token_hash text not null unique,expires_at timestamptz not null,ip_address text,user_agent text,created_at timestamptz not null default now(),last_seen_at timestamptz not null default now())`
 await sql`create index if not exists user_sessions_user_idx on user_sessions(user_id)`
 await sql`create index if not exists user_sessions_company_idx on user_sessions(company_id)`
 await sql`create table if not exists company_invites (id uuid primary key default gen_random_uuid(),company_id uuid not null references companies(id) on delete cascade,email text not null,role text not null default 'member',permissions text[] not null default '{}'::text[],token_hash text not null unique,expires_at timestamptz not null,accepted_at timestamptz,accepted_by uuid references app_users(id) on delete set null,invited_by uuid references app_users(id) on delete set null,created_at timestamptz not null default now())`
 await sql`create index if not exists company_invites_company_idx on company_invites(company_id)`
 await sql`create table if not exists platform_setup_tokens (id uuid primary key default gen_random_uuid(),company_id uuid not null references companies(id) on delete cascade,token_hash text not null unique,expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now())`
}

export async function ensureSchema(){
 const sql=getDb()
 const configuredSlug=(process.env.DEFAULT_COMPANY_SLUG||'immagine').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')||'immagine'
 const configuredName=(process.env.DEFAULT_COMPANY_NAME||'Immagine Comunicação Visual').trim()||'Immagine Comunicação Visual'
 const ready=await sql`select to_regclass('public.financial_entries') is not null as ready`
 if(ready[0]?.ready){
  await ensureAuthSchema(sql)
  await sql`alter table financial_entries add column if not exists payment_method text`
  await sql`alter table financial_entries add column if not exists source_type text`
  await sql`alter table financial_entries add column if not exists source_id text`
  await sql`create unique index if not exists financial_source_uidx on financial_entries(company_id,source_type,source_id,entry_type) where source_id is not null`
  let companies=await sql`select id from companies where slug=${configuredSlug} limit 1`
  if(!companies.length){ await sql`insert into companies(name,slug) values (${configuredName},${configuredSlug}) on conflict(slug) do nothing`; companies=await sql`select id from companies where slug=${configuredSlug} limit 1` }
  return companies[0].id as string
 }
 await sql`create table if not exists companies (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, primary_color text not null default '#3157ff', accent_color text not null default '#16c79a', created_at timestamptz not null default now())`
 await sql`alter table companies add column if not exists document text`
 await sql`alter table companies add column if not exists phone text`
 await sql`alter table companies add column if not exists whatsapp text`
 await sql`alter table companies add column if not exists email text`
 await sql`alter table companies add column if not exists logo_url text`
 await sql`alter table companies add column if not exists legal_name text`
 await sql`alter table companies add column if not exists trade_name text`
 await sql`alter table companies add column if not exists state_registration text`
 await sql`alter table companies add column if not exists postal_code text`
 await sql`alter table companies add column if not exists street text`
 await sql`alter table companies add column if not exists address_number text`
 await sql`alter table companies add column if not exists complement text`
 await sql`alter table companies add column if not exists district text`
 await sql`alter table companies add column if not exists city text`
 await sql`alter table companies add column if not exists state text`
 await ensureAuthSchema(sql)
 await sql`create table if not exists clients (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, name text not null, phone text, whatsapp text, email text, created_at timestamptz not null default now())`
 await sql`alter table clients add column if not exists person_type text not null default 'PJ'`
 await sql`alter table clients add column if not exists document text`
 await sql`alter table clients add column if not exists legal_name text`
 await sql`alter table clients add column if not exists trade_name text`
 await sql`alter table clients add column if not exists state_registration text`
 await sql`alter table clients add column if not exists postal_code text`
 await sql`alter table clients add column if not exists street text`
 await sql`alter table clients add column if not exists address_number text`
 await sql`alter table clients add column if not exists complement text`
 await sql`alter table clients add column if not exists district text`
 await sql`alter table clients add column if not exists city text`
 await sql`alter table clients add column if not exists state text`
 await sql`create unique index if not exists clients_company_document_uidx on clients(company_id,document) where document is not null`
 await sql`create table if not exists work_orders (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, client_id uuid references clients(id) on delete set null, code text not null, title text not null, description text, stage text not null default 'Orçamento', total numeric(14,2) not null default 0, estimated_cost numeric(14,2) not null default 0, actual_cost numeric(14,2) not null default 0, due_date date, created_at timestamptz not null default now(), unique(company_id,code))`
 await sql`create table if not exists work_order_items (id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade, description text not null, quantity numeric(12,3) not null default 1, unit text not null default 'un', unit_price numeric(14,2) not null default 0, created_at timestamptz not null default now())`
 await sql`create table if not exists service_catalog (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, category text not null, name text not null, unit text not null default 'un', description text, base_price numeric(14,2) not null default 0, formula_type text not null default 'fixed', active boolean not null default true, created_at timestamptz not null default now())`
 await sql`create unique index if not exists service_catalog_company_name_uidx on service_catalog(coalesce(company_id,'00000000-0000-0000-0000-000000000000'::uuid),name)`
 await sql`alter table work_order_items add column if not exists catalog_id uuid references service_catalog(id) on delete set null`
 await sql`alter table work_order_items add column if not exists production_hours numeric(10,3) not null default 0`
 await sql`alter table work_order_items add column if not exists installation_hours numeric(10,3) not null default 0`
 await sql`alter table work_order_items add column if not exists machine_hours numeric(10,3) not null default 0`
 await sql`create table if not exists company_pricing_settings (company_id uuid primary key references companies(id) on delete cascade, production_hour_cost numeric(14,2) not null default 0, installation_hour_cost numeric(14,2) not null default 0, machine_hour_cost numeric(14,2) not null default 0, travel_km_cost numeric(14,2) not null default 0, tax_percent numeric(7,3) not null default 0, commission_percent numeric(7,3) not null default 0, waste_percent numeric(7,3) not null default 0, minimum_margin_percent numeric(7,3) not null default 0, updated_at timestamptz not null default now())`
 await sql`alter table service_catalog add column if not exists production_hours_per_unit numeric(10,3) not null default 0`
 await sql`alter table service_catalog add column if not exists installation_hours_per_unit numeric(10,3) not null default 0`
 await sql`alter table service_catalog add column if not exists machine_hours_per_unit numeric(10,3) not null default 0`
 await sql`create table if not exists service_catalog_company_settings (company_id uuid not null references companies(id) on delete cascade, service_catalog_id uuid not null references service_catalog(id) on delete cascade, base_price numeric(14,2), production_hours_per_unit numeric(10,3), installation_hours_per_unit numeric(10,3), machine_hours_per_unit numeric(10,3), active boolean, updated_at timestamptz not null default now(), primary key(company_id,service_catalog_id))`
 await sql`alter table work_orders add column if not exists quote_valid_until date`
 await sql`alter table work_orders add column if not exists payment_terms text`
 await sql`alter table work_orders add column if not exists quote_notes text`
 await sql`alter table work_orders add column if not exists discount numeric(14,2) not null default 0`
 await sql`alter table work_orders add column if not exists production_hours numeric(10,2) not null default 0`
 await sql`alter table work_orders add column if not exists installation_hours numeric(10,2) not null default 0`
 await sql`alter table work_orders add column if not exists machine_hours numeric(10,2) not null default 0`
 await sql`alter table work_orders add column if not exists travel_km numeric(10,2) not null default 0`
 await sql`create table if not exists materials (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, name text not null, unit text not null default 'un', stock_quantity numeric(14,3) not null default 0, min_stock numeric(14,3) not null default 0, unit_cost numeric(14,2) not null default 0, created_at timestamptz not null default now(), unique(company_id,name))`
 await sql`create table if not exists service_catalog_materials (id uuid primary key default gen_random_uuid(), service_catalog_id uuid not null references service_catalog(id) on delete cascade, material_id uuid not null references materials(id) on delete cascade, consumption_per_unit numeric(14,4) not null default 1, waste_percent numeric(7,3) not null default 0, unique(service_catalog_id,material_id))`
 await sql`create table if not exists inventory_movements (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, material_id uuid not null references materials(id) on delete restrict, work_order_id uuid references work_orders(id) on delete set null, movement_type text not null, quantity numeric(14,3) not null, unit_cost numeric(14,2) not null default 0, created_at timestamptz not null default now())`
 await sql`create unique index if not exists inventory_os_material_reserve_uidx on inventory_movements(work_order_id,material_id,movement_type) where work_order_id is not null and movement_type='reserve'`
 await sql`create table if not exists stock_invoices (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, access_key text, number text, series text, supplier_name text, supplier_document text, issued_at timestamptz, total numeric(14,2) not null default 0, created_at timestamptz not null default now())`
 await sql`create unique index if not exists stock_invoices_company_key_uidx on stock_invoices(company_id,access_key) where access_key is not null`
 await sql`create table if not exists stock_invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references stock_invoices(id) on delete cascade, supplier_code text, description text not null, ncm text, cfop text, unit text, quantity numeric(14,4) not null default 0, unit_cost numeric(14,4) not null default 0, material_id uuid references materials(id) on delete set null, created_at timestamptz not null default now())`
 await sql`alter table stock_invoice_items add column if not exists posted_at timestamptz`
 await sql`create table if not exists supplier_material_mappings (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, supplier_document text not null, supplier_code text not null, material_id uuid not null references materials(id) on delete cascade, created_at timestamptz not null default now(), unique(company_id,supplier_document,supplier_code))`
 await sql`create table if not exists work_order_materials (id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade, material_id uuid not null references materials(id) on delete restrict, quantity numeric(14,3) not null default 1, reserved_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(), unique(work_order_id,material_id))`
 await sql`create table if not exists work_order_item_materials (id uuid primary key default gen_random_uuid(), work_order_item_id uuid not null references work_order_items(id) on delete cascade, material_id uuid not null references materials(id) on delete restrict, quantity numeric(14,4) not null default 0, unit_cost numeric(14,2) not null default 0, created_at timestamptz not null default now(), unique(work_order_item_id,material_id))`
 await sql`alter table work_orders add column if not exists installation_scheduled_at timestamptz`
 await sql`alter table work_orders add column if not exists installation_team text`
 await sql`alter table work_orders add column if not exists installation_address text`
 await sql`alter table work_orders add column if not exists installation_notes text`
 await sql`alter table work_orders add column if not exists installed_at timestamptz`
 await sql`create table if not exists work_order_events (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, work_order_id uuid not null references work_orders(id) on delete cascade, event_type text not null, title text not null, detail text, created_at timestamptz not null default now())`
 await sql`create table if not exists artwork_versions (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, work_order_id uuid not null references work_orders(id) on delete cascade, version_no int not null default 1, file_url text not null, file_name text not null, note text, status text not null default 'pending', approved_at timestamptz, created_at timestamptz not null default now(), unique(work_order_id,version_no))`
 await sql`create table if not exists work_order_tasks (id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade, title text not null, task_type text not null default 'production', status text not null default 'pending', sort_order int not null default 0, created_at timestamptz not null default now())`
 await sql`alter table work_order_tasks add column if not exists sector text not null default 'Produção'`
 await sql`alter table work_order_tasks add column if not exists responsible text`
 await sql`alter table work_order_tasks add column if not exists started_at timestamptz`
 await sql`alter table work_order_tasks add column if not exists completed_at timestamptz`
 await sql`alter table work_order_tasks add column if not exists estimated_minutes int not null default 0`
 await sql`create unique index if not exists work_order_task_unique on work_order_tasks(work_order_id,title)`
 await sql`alter table work_orders add column if not exists approved_at timestamptz`
 await sql`alter table work_orders add column if not exists approval_note text`
 await sql`alter table work_orders add column if not exists public_token uuid`
 await sql`create unique index if not exists work_orders_public_token_uidx on work_orders(public_token) where public_token is not null`
 await sql`alter table work_orders add column if not exists public_approved_at timestamptz`
 await sql`alter table work_orders add column if not exists public_token_expires_at timestamptz`
 await sql`alter table work_orders add column if not exists public_approved_name text`
 await sql`create table if not exists financial_entries (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, work_order_id uuid references work_orders(id) on delete set null, entry_type text not null, description text not null, amount numeric(14,2) not null, due_date date, paid_at timestamptz, status text not null default 'pending', created_at timestamptz not null default now())`
 await sql`create unique index if not exists financial_work_order_receivable_uidx on financial_entries(work_order_id,entry_type) where work_order_id is not null and entry_type='receivable'`
 await sql`alter table financial_entries add column if not exists payment_method text`
 await sql`alter table financial_entries add column if not exists source_type text`
 await sql`alter table financial_entries add column if not exists source_id text`
 await sql`create unique index if not exists financial_source_uidx on financial_entries(company_id,source_type,source_id,entry_type) where source_id is not null`
 let companies=await sql`select id from companies where slug=${configuredSlug} limit 1`
 if(!companies.length){ await sql`insert into companies(name,slug) values (${configuredName},${configuredSlug}) on conflict(slug) do nothing`; companies=await sql`select id from companies where slug=${configuredSlug} limit 1` }
 const companyId=companies[0].id as string
 return companyId
}


export async function ensureDb(permission?:string){
 const fallbackCompanyId=await ensureSchema()
 const {headers}=await import('next/headers')
 const h=await headers()
 if(h.get('x-public-company-bootstrap')==='1')return fallbackCompanyId
 const forwardedCompany=h.get('x-company-id')
 if(forwardedCompany){
  if(permission&&h.get('x-super-admin')!=='1'){
   const permissions=(h.get('x-permissions')||'').split(',').filter(Boolean)
   if(!permissions.includes(permission))throw new Error('FORBIDDEN')
  }
  return forwardedCompany
 }
 const {getAuthContext}=await import('./auth')
 const ctx=await getAuthContext()
 if(!ctx)throw new Error('AUTH_REQUIRED')
 if(permission&&!ctx.permissions.map(String).includes(permission))throw new Error('FORBIDDEN')
 return ctx.companyId
}
