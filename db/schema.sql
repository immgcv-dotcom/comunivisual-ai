-- ComuniVisual AI - canonical PostgreSQL/Neon schema
create extension if not exists pgcrypto;

create table if not exists companies (
 id uuid primary key default gen_random_uuid(),
 name text not null, slug text unique not null,
 document text, phone text, whatsapp text, email text, logo_url text,
 primary_color text not null default '#3157ff', accent_color text not null default '#16c79a',
 created_at timestamptz not null default now()
);

create table if not exists clients (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 person_type text not null default 'PJ', name text not null, document text, legal_name text, trade_name text,
 state_registration text, phone text, whatsapp text, email text, postal_code text, street text,
 address_number text, complement text, district text, city text, state text, created_at timestamptz not null default now()
);
create unique index if not exists clients_company_document_uidx on clients(company_id,document) where document is not null;

create table if not exists service_catalog (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
 category text not null, name text not null, unit text not null default 'un', description text,
 base_price numeric(14,2) not null default 0, formula_type text not null default 'fixed', active boolean not null default true,
 production_hours_per_unit numeric(10,3) not null default 0, installation_hours_per_unit numeric(10,3) not null default 0,
 machine_hours_per_unit numeric(10,3) not null default 0, created_at timestamptz not null default now()
);
create unique index if not exists service_catalog_company_name_uidx on service_catalog(coalesce(company_id,'00000000-0000-0000-0000-000000000000'::uuid),name);

create table if not exists service_catalog_company_settings (
 company_id uuid not null references companies(id) on delete cascade,
 service_catalog_id uuid not null references service_catalog(id) on delete cascade,
 base_price numeric(14,2), production_hours_per_unit numeric(10,3), installation_hours_per_unit numeric(10,3),
 machine_hours_per_unit numeric(10,3), active boolean, updated_at timestamptz not null default now(),
 primary key(company_id,service_catalog_id)
);

create table if not exists company_pricing_settings (
 company_id uuid primary key references companies(id) on delete cascade,
 production_hour_cost numeric(14,2) not null default 0, installation_hour_cost numeric(14,2) not null default 0,
 machine_hour_cost numeric(14,2) not null default 0, travel_km_cost numeric(14,2) not null default 0,
 tax_percent numeric(7,3) not null default 0, commission_percent numeric(7,3) not null default 0,
 waste_percent numeric(7,3) not null default 0, minimum_margin_percent numeric(7,3) not null default 0,
 updated_at timestamptz not null default now()
);

create table if not exists materials (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 name text not null, unit text not null default 'un', stock_quantity numeric(14,3) not null default 0,
 min_stock numeric(14,3) not null default 0, unit_cost numeric(14,2) not null default 0,
 created_at timestamptz not null default now(), unique(company_id,name)
);

create table if not exists service_catalog_materials (
 id uuid primary key default gen_random_uuid(), service_catalog_id uuid not null references service_catalog(id) on delete cascade,
 material_id uuid not null references materials(id) on delete cascade, consumption_per_unit numeric(14,4) not null default 1,
 waste_percent numeric(7,3) not null default 0, unique(service_catalog_id,material_id)
);

create table if not exists work_orders (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 client_id uuid references clients(id) on delete set null, code text not null, title text not null, description text,
 stage text not null default 'Orçamento', total numeric(14,2) not null default 0, estimated_cost numeric(14,2) not null default 0,
 actual_cost numeric(14,2) not null default 0, due_date date, quote_valid_until date, payment_terms text, quote_notes text,
 discount numeric(14,2) not null default 0, production_hours numeric(10,2) not null default 0,
 installation_hours numeric(10,2) not null default 0, machine_hours numeric(10,2) not null default 0,
 travel_km numeric(10,2) not null default 0, approved_at timestamptz, approval_note text,
 public_token uuid, public_approved_at timestamptz, public_token_expires_at timestamptz, public_approved_name text,
 created_at timestamptz not null default now(), unique(company_id,code)
);
create unique index if not exists work_orders_public_token_uidx on work_orders(public_token) where public_token is not null;
create index if not exists idx_work_orders_company_stage on work_orders(company_id,stage);

create table if not exists work_order_items (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade,
 catalog_id uuid references service_catalog(id) on delete set null, description text not null,
 quantity numeric(12,3) not null default 1, unit text not null default 'un', unit_price numeric(14,2) not null default 0,
 production_hours numeric(10,3) not null default 0, installation_hours numeric(10,3) not null default 0,
 machine_hours numeric(10,3) not null default 0, created_at timestamptz not null default now()
);

create table if not exists work_order_materials (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade,
 material_id uuid not null references materials(id) on delete restrict, quantity numeric(14,3) not null default 1,
 reserved_quantity numeric(14,3) not null default 0, created_at timestamptz not null default now(),
 unique(work_order_id,material_id)
);

create table if not exists work_order_item_materials (
 id uuid primary key default gen_random_uuid(), work_order_item_id uuid not null references work_order_items(id) on delete cascade,
 material_id uuid not null references materials(id) on delete restrict, quantity numeric(14,4) not null default 0,
 unit_cost numeric(14,2) not null default 0, created_at timestamptz not null default now(),
 unique(work_order_item_id,material_id)
);

create table if not exists work_order_tasks (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade,
 title text not null, task_type text not null default 'production', status text not null default 'pending',
 sort_order int not null default 0, created_at timestamptz not null default now()
);
create unique index if not exists work_order_task_unique on work_order_tasks(work_order_id,title);

create table if not exists inventory_movements (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 material_id uuid not null references materials(id) on delete restrict, work_order_id uuid references work_orders(id) on delete set null,
 movement_type text not null, quantity numeric(14,3) not null, unit_cost numeric(14,2) not null default 0,
 created_at timestamptz not null default now()
);
create unique index if not exists inventory_os_material_reserve_uidx on inventory_movements(work_order_id,material_id,movement_type) where work_order_id is not null and movement_type='reserve';

create table if not exists financial_entries (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 work_order_id uuid references work_orders(id) on delete set null, entry_type text not null,
 description text not null, amount numeric(14,2) not null, due_date date, paid_at timestamptz,
 status text not null default 'pending', created_at timestamptz not null default now()
);
create unique index if not exists financial_work_order_receivable_uidx on financial_entries(work_order_id,entry_type) where work_order_id is not null and entry_type='receivable';
create index if not exists idx_clients_company on clients(company_id);
create index if not exists idx_materials_company on materials(company_id);
create index if not exists idx_financial_company_due on financial_entries(company_id,due_date);

insert into companies(name,slug) values ('Immagine Comunicação Visual','immagine') on conflict(slug) do nothing;
