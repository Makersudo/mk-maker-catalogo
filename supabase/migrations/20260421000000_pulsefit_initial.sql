-- Source: database\schema.sql
create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_promo boolean not null default false,
  is_new boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  path text,
  name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text,
  name text not null,
  mime_type text,
  size_bytes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  cep text not null,
  address text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  region text not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'paid', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();



-- Source: database\policies.sql
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.media_files enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (is_active = true);

drop policy if exists "Public can read images for active products" on public.product_images;
create policy "Public can read images for active products"
on public.product_images for select
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
    and products.is_active = true
  )
);

drop policy if exists "Public can read public settings" on public.settings;
create policy "Public can read public settings"
on public.settings for select
using (is_public = true);

-- Escritas administrativas devem passar pelo backend com service role.



-- Source: database\storage.sql
insert into storage.buckets (id, name, public)
values ('mk-maker-media', 'mk-maker-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('mk-maker-products', 'mk-maker-products', true)
on conflict (id) do nothing;

drop policy if exists "Public can read pulsefit media" on storage.objects;
drop policy if exists "Public can read mk maker media" on storage.objects;
create policy "Public can read mk maker media"
on storage.objects for select
using (bucket_id in ('mk-maker-media', 'mk-maker-products'));

-- Uploads e exclusoes devem passar pelo backend com service role.



