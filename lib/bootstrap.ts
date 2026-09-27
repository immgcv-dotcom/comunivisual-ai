import { getDb } from './db'
export async function ensureDb(){
 const sql=getDb()
 await sql`create table if not exists companies (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, primary_color text not null default '#3157ff', accent_color text not null default '#16c79a', created_at timestamptz not null default now())`
 await sql`create table if not exists clients (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, name text not null, phone text, whatsapp text, email text, created_at timestamptz not null default now())`
 await sql`create table if not exists work_orders (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, client_id uuid references clients(id) on delete set null, code text not null, title text not null, description text, stage text not null default 'Orçamento', total numeric(14,2) not null default 0, estimated_cost numeric(14,2) not null default 0, actual_cost numeric(14,2) not null default 0, due_date date, created_at timestamptz not null default now(), unique(company_id,code))`
 await sql`create table if not exists financial_entries (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, work_order_id uuid references work_orders(id) on delete set null, entry_type text not null, description text not null, amount numeric(14,2) not null, due_date date, paid_at timestamptz, status text not null default 'pending', created_at timestamptz not null default now())`
 let companies=await sql`select id from companies limit 1`
 if(!companies.length){ await sql`insert into companies(name,slug) values ('Immagine Comunicação Visual','immagine')`; companies=await sql`select id from companies limit 1` }
 return companies[0].id as string
}
