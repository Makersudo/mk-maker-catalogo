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

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  next_status text not null check (next_status in ('new', 'confirmed', 'preparing', 'ready_for_pickup', 'sent', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now()
);

update public.orders
set status = 'completed'
where status = 'paid';

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'confirmed', 'preparing', 'ready_for_pickup', 'sent', 'completed', 'cancelled'));

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_customer_name on public.orders(customer_name);
create index if not exists idx_order_status_events_order_id on public.order_status_events(order_id);
create index if not exists idx_marketing_campaigns_status_window on public.marketing_campaigns(status, is_active, starts_at, ends_at);
create index if not exists idx_marketing_campaign_products_product_id on public.marketing_campaign_products(product_id);

drop trigger if exists trg_marketing_campaigns_updated_at on public.marketing_campaigns;
create trigger trg_marketing_campaigns_updated_at
before update on public.marketing_campaigns
for each row execute function public.set_updated_at();
