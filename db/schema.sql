-- ComuniVisual AI - PostgreSQL/Neon foundation
create extension if not exists pgcrypto;

create table if not exists companies (
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
 logo_url text, primary_color text not null default '#3157ff', accent_color text not null default '#16c79a',
 min_margin numeric(7,2) not null default 35, tax_pct numeric(7,2) not null default 0,
 production_hour_cost numeric(12,2) not null default 0, installation_hour_cost numeric(12,2) not null default 0,
 km_cost numeric(12,2) not null default 0, waste_pct numeric(7,2) not null default 10,
 created_at timestamptz not null default now()
);
create table if not exists company_users (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 auth_user_id text not null, full_name text not null, role text not null default 'operator'
 check (role in ('owner','admin','commercial','designer','production','installer','finance','operator')),
 unique(company_id,auth_user_id)
);
create table if not exists clients (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 name text not null, document text, phone text, whatsapp text, email text, address text, notes text,
 created_at timestamptz not null default now()
);
create table if not exists suppliers (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 name text not null, document text, phone text, email text, notes text
);
create table if not exists service_catalog (
 id uuid primary key default gen_random_uuid(), category text not null, name text not null, unit text not null default 'un',
 formula_key text, default_waste_pct numeric(7,2) not null default 10, active boolean not null default true,
 unique(category,name)
);
create table if not exists materials (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 supplier_id uuid references suppliers(id) on delete set null, category text, name text not null, unit text not null,
 cost numeric(12,4) not null default 0, stock_qty numeric(14,4) not null default 0,
 reserved_qty numeric(14,4) not null default 0, min_stock numeric(14,4) not null default 0, active boolean not null default true
);
create table if not exists work_orders (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 client_id uuid references clients(id) on delete set null, code text not null, title text not null, description text,
 stage text not null default 'Orçamento' check(stage in ('Atendimento','Orçamento','Aprovado','Arte','Produção','Instalação','Concluído','Cancelado')),
 total numeric(14,2) not null default 0, estimated_cost numeric(14,2) not null default 0,
 actual_cost numeric(14,2) not null default 0, due_date date, approved_at timestamptz, completed_at timestamptz,
 created_at timestamptz not null default now(), unique(company_id,code)
);
create table if not exists work_order_items (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade,
 catalog_id uuid references service_catalog(id) on delete set null, description text not null, quantity numeric(14,4) not null default 1,
 unit text not null default 'un', unit_price numeric(14,2) not null default 0, cost numeric(14,2) not null default 0,
 specs jsonb not null default '{}'::jsonb
);
create table if not exists work_order_tasks (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references work_orders(id) on delete cascade,
 title text not null, department text, completed boolean not null default false, sort_order integer not null default 0
);
create table if not exists inventory_movements (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 material_id uuid not null references materials(id) on delete cascade, work_order_id uuid references work_orders(id) on delete set null,
 movement_type text not null check(movement_type in ('in','out','reserve','release','adjustment')),
 quantity numeric(14,4) not null, unit_cost numeric(14,4), created_at timestamptz not null default now()
);
create table if not exists financial_entries (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
 work_order_id uuid references work_orders(id) on delete set null, client_id uuid references clients(id) on delete set null,
 supplier_id uuid references suppliers(id) on delete set null, entry_type text not null check(entry_type in ('receivable','payable')),
 description text not null, amount numeric(14,2) not null, due_date date, paid_at timestamptz,
 status text not null default 'pending' check(status in ('pending','paid','overdue','cancelled')), created_at timestamptz not null default now()
);
create index if not exists idx_clients_company on clients(company_id);
create index if not exists idx_materials_company on materials(company_id);
create index if not exists idx_work_orders_company_stage on work_orders(company_id,stage);
create index if not exists idx_financial_company_due on financial_entries(company_id,due_date);

insert into service_catalog(category,name,unit,formula_key) values
('Adesivos','Adesivo impressão digital','m²','print_area'),('Adesivos','Adesivo recorte eletrônico','m²','cut_vinyl'),
('Adesivos','Adesivo perfurado','m²','print_area'),('Adesivos','Envelopamento parcial','m²','vehicle_wrap'),
('Adesivos','Envelopamento total','m²','vehicle_wrap'),('Lonas','Banner com acabamento','m²','banner'),
('Lonas','Faixa em lona','m²','banner'),('Lonas','Frontlight','m²','banner'),('Lonas','Backlight','m²','banner'),
('Placas','Placa em PVC','m²','rigid_board'),('Placas','Placa em ACM','m²','rigid_board'),
('Placas','Placa em acrílico','m²','rigid_board'),('Fachadas','Fachada em ACM','m²','acm_facade'),
('Fachadas','Fachada em lona','m²','canvas_facade'),('Fachadas','Totem','un','totem'),
('Letras','Letra caixa ACM','m²','box_letter'),('Letras','Letra caixa acrílico','m²','box_letter'),
('Letras','Letra PVC expandido','m²','cut_letter'),('Iluminação','LED para letra caixa','m','led'),
('Instalação','Equipe de instalação','h','installation_hour')
on conflict(category,name) do nothing;
