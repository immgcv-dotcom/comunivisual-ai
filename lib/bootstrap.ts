import { getDb } from './db'
export async function ensureDb(){
 const sql=getDb()
 await sql`create table if not exists companies (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, primary_color text not null default '#3157ff', accent_color text not null default '#16c79a', created_at timestamptz not null default now())`
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
 await sql`create table if not exists work_order_tasks (id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade, title text not null, task_type text not null default 'production', status text not null default 'pending', sort_order int not null default 0, created_at timestamptz not null default now())`
 await sql`create unique index if not exists work_order_task_unique on work_order_tasks(work_order_id,title)`
 await sql`alter table work_orders add column if not exists approved_at timestamptz`
 await sql`alter table work_orders add column if not exists approval_note text`
 await sql`create table if not exists financial_entries (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, work_order_id uuid references work_orders(id) on delete set null, entry_type text not null, description text not null, amount numeric(14,2) not null, due_date date, paid_at timestamptz, status text not null default 'pending', created_at timestamptz not null default now())`
 await sql`create unique index if not exists financial_work_order_receivable_uidx on financial_entries(work_order_id,entry_type) where work_order_id is not null and entry_type='receivable'`
 let companies=await sql`select id from companies where slug='immagine' limit 1`
 if(!companies.length){ await sql`insert into companies(name,slug) values ('Immagine Comunicação Visual','immagine') on conflict(slug) do nothing`; companies=await sql`select id from companies where slug='immagine' limit 1` }
 return companies[0].id as string
}
