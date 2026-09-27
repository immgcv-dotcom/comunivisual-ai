-- Base multiempresa para o ERP de comunicação visual
create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text not null default '#3157ff',
  accent_color text not null default '#16c79a',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  role text not null default 'operator',
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  document text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  unit text not null default 'un',
  default_waste_pct numeric not null default 0,
  formula_key text,
  active boolean not null default true
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  unit text not null,
  cost numeric not null default 0,
  stock_qty numeric not null default 0,
  min_stock numeric not null default 0
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid references clients(id),
  code text not null,
  title text not null,
  description text,
  stage text not null default 'Orçamento',
  total numeric not null default 0,
  estimated_cost numeric not null default 0,
  due_date date,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(company_id, code)
);

create table if not exists work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  catalog_item_id uuid references service_catalog(id),
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  cost numeric not null default 0
);

create table if not exists work_order_tasks (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  title text not null,
  department text,
  done boolean not null default false,
  sort_order int not null default 0
);

create table if not exists financial_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  work_order_id uuid references work_orders(id),
  kind text not null check (kind in ('receivable','payable')),
  description text not null,
  amount numeric not null,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Catálogo mestre inicial: pode ser expandido para 300+ itens
insert into service_catalog(category,name,unit,default_waste_pct,formula_key) values
('Adesivos','Adesivo impressão digital','m²',10,'area_print'),
('Adesivos','Adesivo recorte eletrônico','m²',12,'area_cut'),
('Adesivos','Adesivo perfurado','m²',10,'area_print'),
('Adesivos','Envelopamento parcial','m²',18,'vehicle_wrap'),
('Adesivos','Envelopamento total','m²',22,'vehicle_wrap'),
('Lonas','Banner com acabamento','m²',8,'banner'),
('Lonas','Faixa em lona','m²',8,'banner'),
('Lonas','Frontlight','m²',10,'banner'),
('Lonas','Backlight','m²',10,'banner'),
('Placas','Placa em PVC','m²',12,'sheet'),
('Placas','Placa em ACM','m²',15,'sheet'),
('Placas','Placa em acrílico','m²',15,'sheet'),
('Fachadas','Fachada em ACM','m²',15,'facade_acm'),
('Fachadas','Fachada em lona','m²',12,'facade_canvas'),
('Fachadas','Totem','un',15,'totem'),
('Letras','Letra caixa ACM','m²',18,'letter_box'),
('Letras','Letra caixa acrílico','m²',18,'letter_box'),
('Letras','Letra PVC expandido','m²',15,'letter_flat'),
('Iluminação','LED para letra caixa','m',10,'led'),
('Instalação','Equipe de instalação','h',0,'labor_install')
on conflict do nothing;
