create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid references public.categories(id) on delete set null,
  audience text check (audience is null or audience in ('beleza')),
  brand_label text not null default 'MK MAKER',
  product_type text,
  variation text,
  features jsonb not null default '[]'::jsonb,
  image_prompt text,
  catalog_status text not null default 'draft' check (catalog_status in ('draft', 'ready', 'live')),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_promo boolean not null default false,
  is_new boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  variants_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  sku text,
  options jsonb not null default '[]'::jsonb,
  price numeric(12,2) check (price is null or price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
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
  cep text,
  address text,
  number text,
  complement text,
  neighborhood text,
  region text,
  city text,
  state text,
  reference_point text,
  fulfillment_type text not null default 'delivery' check (fulfillment_type in ('delivery', 'pickup')),
  payment_method text not null default 'pix' check (payment_method in ('cash', 'pix', 'card')),
  order_code text unique,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'preparing', 'ready_for_pickup', 'sent', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  variant_options jsonb not null default '[]'::jsonb,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  unit_purchase_cost numeric(12,2) not null default 0 check (unit_purchase_cost >= 0),
  cost_subtotal numeric(12,2) not null default 0 check (cost_subtotal >= 0),
  category_id uuid,
  category_name text,
  subcategory_id uuid,
  subcategory_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  timezone text not null default 'America/Sao_Paulo',
  total_products integer not null default 0 check (total_products >= 0),
  active_products integer not null default 0 check (active_products >= 0),
  live_products integer not null default 0 check (live_products >= 0),
  products_with_image integer not null default 0 check (products_with_image >= 0),
  products_without_image integer not null default 0 check (products_without_image >= 0),
  products_with_purchase_cost integer not null default 0 check (products_with_purchase_cost >= 0),
  stock_total_units integer not null default 0 check (stock_total_units >= 0),
  healthy_stock_products integer not null default 0 check (healthy_stock_products >= 0),
  low_stock_products integer not null default 0 check (low_stock_products >= 0),
  zero_stock_products integer not null default 0 check (zero_stock_products >= 0),
  inventory_purchase_value numeric(14,2) not null default 0 check (inventory_purchase_value >= 0),
  inventory_sale_value numeric(14,2) not null default 0 check (inventory_sale_value >= 0),
  estimated_gross_profit numeric(14,2) not null default 0,
  featured_products integer not null default 0 check (featured_products >= 0),
  promo_products integer not null default 0 check (promo_products >= 0),
  new_products integer not null default 0 check (new_products >= 0),
  completion_score integer not null default 0 check (completion_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_category_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  category_id uuid not null,
  category_name text not null,
  total_products integer not null default 0 check (total_products >= 0),
  active_products integer not null default 0 check (active_products >= 0),
  live_products integer not null default 0 check (live_products >= 0),
  stock_total_units integer not null default 0 check (stock_total_units >= 0),
  inventory_purchase_value numeric(14,2) not null default 0 check (inventory_purchase_value >= 0),
  inventory_sale_value numeric(14,2) not null default 0 check (inventory_sale_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_date, category_id)
);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  next_status text not null check (next_status in ('new', 'confirmed', 'preparing', 'ready_for_pickup', 'sent', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('new_order')),
  title text not null,
  message text not null,
  order_id uuid references public.orders(id) on delete cascade,
  order_code text,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null default 'promotion' check (type in ('promotion', 'launch', 'featured', 'flash')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'expired')),
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  discount_type text not null default 'none' check (discount_type in ('none', 'percent', 'fixed', 'override_price')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  badge_label text not null default 'OFERTA',
  banner_title text,
  banner_subtitle text,
  banner_image_url text,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_campaign_products (
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  campaign_price numeric(12,2) check (campaign_price is null or campaign_price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (campaign_id, product_id)
);

create table if not exists public.settings (
  key text primary key,
  value text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_config (
  id boolean primary key default true check (id = true),
  store_name text not null default 'MK MAKER',
  store_slug text not null default 'mk-maker',
  logo_url text,
  banner_url text,
  primary_color text not null default '#c98f86',
  secondary_color text not null default '#111111',
  whatsapp_phone text,
  checkout_mode text not null default 'whatsapp' check (checkout_mode in ('whatsapp', 'internal_order', 'external_link', 'pix_whatsapp')),
  external_checkout_url text,
  plan_code text not null default 'medium' check (plan_code in ('basic', 'medium', 'master', 'custom')),
  max_products integer check (max_products is null or max_products >= 0),
  max_categories integer check (max_categories is null or max_categories >= 0),
  max_subcategories integer check (max_subcategories is null or max_subcategories >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.catalog_config (id)
values (true)
on conflict (id) do nothing;

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_subcategory_id on public.products(subcategory_id);
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_active on public.product_variants(is_active);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_order_code on public.orders(order_code);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_customer_name on public.orders(customer_name);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_category_id on public.order_items(category_id);
create index if not exists idx_order_items_subcategory_id on public.order_items(subcategory_id);
create index if not exists idx_analytics_daily_snapshots_date on public.analytics_daily_snapshots(snapshot_date desc);
create index if not exists idx_analytics_category_snapshots_date on public.analytics_category_daily_snapshots(snapshot_date desc);
create index if not exists idx_analytics_category_snapshots_category_date on public.analytics_category_daily_snapshots(category_id, snapshot_date desc);
create index if not exists idx_order_status_events_order_id on public.order_status_events(order_id);
create index if not exists idx_notifications_unread_created_at on public.notifications(is_read, created_at desc);
create index if not exists idx_notifications_order_id on public.notifications(order_id);
create index if not exists idx_push_subscriptions_active on public.push_subscriptions(is_active);
create index if not exists idx_marketing_campaigns_status_window on public.marketing_campaigns(status, is_active, starts_at, ends_at);
create index if not exists idx_marketing_campaign_products_product_id on public.marketing_campaign_products(product_id);
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.decrement_inventory_stock(
  target_table text,
  target_id uuid,
  decrement_by integer
)
returns table(previous_stock integer, next_stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock integer;
begin
  if decrement_by <= 0 then
    raise exception 'Quantidade de estoque invalida.';
  end if;

  if target_table = 'products' then
    select stock_quantity
      into current_stock
      from public.products
      where id = target_id
      for update;

    if not found or current_stock < decrement_by then
      raise exception 'Estoque insuficiente para o produto selecionado.';
    end if;

    update public.products
      set stock_quantity = current_stock - decrement_by,
          updated_at = now()
      where id = target_id;
  elsif target_table = 'product_variants' then
    select stock_quantity
      into current_stock
      from public.product_variants
      where id = target_id
      for update;

    if not found or current_stock < decrement_by then
      raise exception 'Estoque insuficiente para a variacao selecionada.';
    end if;

    update public.product_variants
      set stock_quantity = current_stock - decrement_by,
          updated_at = now()
      where id = target_id;
  else
    raise exception 'Tabela de estoque invalida.';
  end if;

  previous_stock := current_stock;
  next_stock := current_stock - decrement_by;
  return next;
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

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_catalog_config_updated_at on public.catalog_config;
create trigger trg_catalog_config_updated_at
before update on public.catalog_config
for each row execute function public.set_updated_at();

drop trigger if exists trg_analytics_daily_snapshots_updated_at on public.analytics_daily_snapshots;
create trigger trg_analytics_daily_snapshots_updated_at
before update on public.analytics_daily_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists trg_analytics_category_daily_snapshots_updated_at on public.analytics_category_daily_snapshots;
create trigger trg_analytics_category_daily_snapshots_updated_at
before update on public.analytics_category_daily_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();
