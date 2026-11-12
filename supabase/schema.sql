-- Roses gul do'koni — Supabase sxemasi.
-- Supabase → SQL Editor → shu faylni to'liq qo'yib "Run" bosing.
-- Jadvallar "roses_" bilan boshlanadi, shuning uchun loyihadagi boshqa jadvallarga tegmaydi.

create table if not exists roses_categories (
  id text primary key,
  name text not null,
  image text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists roses_products (
  id text primary key,
  category_id text references roses_categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price int not null default 0,
  old_price int,
  images jsonb not null default '[]'::jsonb,
  is_promo boolean not null default false,
  is_new boolean not null default false,
  in_stock boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists roses_products_category on roses_products(category_id);

create table if not exists roses_banners (
  id text primary key,
  title text not null default '',
  subtitle text not null default '',
  image text not null default '',
  button_text text not null default '',
  link_type text not null default 'none',
  link_value text not null default '',
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists roses_promos (
  id text primary key,
  code text not null unique,
  title text not null default '',
  type text not null default 'percent',
  value int not null default 0,
  min_total int not null default 0,
  max_uses int,
  uses int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  show_on_home boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists roses_customers (
  id text primary key,               -- Telegram user id
  first_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  name text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roses_orders (
  id text primary key,
  number int not null,
  customer_id text not null,
  tg_username text not null default '',
  items jsonb not null default '[]'::jsonb,
  subtotal int not null default 0,
  discount int not null default 0,
  delivery_fee int not null default 0,
  total int not null default 0,
  promo_code text,
  name text not null default '',
  phone text not null default '',
  address text not null default '',
  delivery_time text not null default '',
  comment text not null default '',
  payment text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists roses_orders_customer on roses_orders(customer_id, created_at desc);

create table if not exists roses_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
insert into roses_settings (id, data) values ('main', '{}'::jsonb) on conflict (id) do nothing;

-- Faqat server (service_role kaliti) o'qiy oladi va yoza oladi; brauzerdan to'g'ridan-to'g'ri kirish yopiq.
alter table roses_categories enable row level security;
alter table roses_products   enable row level security;
alter table roses_banners    enable row level security;
alter table roses_promos     enable row level security;
alter table roses_customers  enable row level security;
alter table roses_orders     enable row level security;
alter table roses_settings   enable row level security;

-- Rasmlar uchun ochiq (public) bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('roses', 'roses', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
