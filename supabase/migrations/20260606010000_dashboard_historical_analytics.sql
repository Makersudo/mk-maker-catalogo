alter table public.order_items
  add column if not exists unit_purchase_cost numeric(12,2) not null default 0 check (unit_purchase_cost >= 0),
  add column if not exists cost_subtotal numeric(12,2) not null default 0 check (cost_subtotal >= 0),
  add column if not exists category_id uuid,
  add column if not exists category_name text,
  add column if not exists subcategory_id uuid,
  add column if not exists subcategory_name text;

update public.order_items as item
set
  unit_purchase_cost = coalesce(product.purchase_cost, 0),
  cost_subtotal = round(coalesce(product.purchase_cost, 0) * item.quantity, 2),
  category_id = product.category_id,
  category_name = category.name,
  subcategory_id = product.subcategory_id,
  subcategory_name = subcategory.name
from public.products as product
left join public.categories as category on category.id = product.category_id
left join public.categories as subcategory on subcategory.id = product.subcategory_id
where item.product_id = product.id
  and item.unit_purchase_cost = 0
  and item.cost_subtotal = 0;

create index if not exists idx_order_items_category_id on public.order_items(category_id);
create index if not exists idx_order_items_subcategory_id on public.order_items(subcategory_id);

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
  -- Historical category facts must survive later catalog reorganization/deletion.
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

create index if not exists idx_analytics_daily_snapshots_date
  on public.analytics_daily_snapshots(snapshot_date desc);
create index if not exists idx_analytics_category_snapshots_date
  on public.analytics_category_daily_snapshots(snapshot_date desc);
create index if not exists idx_analytics_category_snapshots_category_date
  on public.analytics_category_daily_snapshots(category_id, snapshot_date desc);

alter table public.analytics_daily_snapshots enable row level security;
alter table public.analytics_category_daily_snapshots enable row level security;

drop trigger if exists trg_analytics_daily_snapshots_updated_at on public.analytics_daily_snapshots;
create trigger trg_analytics_daily_snapshots_updated_at
before update on public.analytics_daily_snapshots
for each row execute function public.set_updated_at();

drop trigger if exists trg_analytics_category_daily_snapshots_updated_at on public.analytics_category_daily_snapshots;
create trigger trg_analytics_category_daily_snapshots_updated_at
before update on public.analytics_category_daily_snapshots
for each row execute function public.set_updated_at();

create or replace function public.analytics_bucket_start(p_date date, p_period text)
returns date
language sql
immutable
as $$
  select case p_period
    when 'daily' then p_date
    when 'weekly' then date_trunc('week', p_date::timestamp)::date
    when 'monthly' then date_trunc('month', p_date::timestamp)::date
    when 'yearly' then date_trunc('year', p_date::timestamp)::date
    else p_date
  end;
$$;

create or replace function public.dashboard_sales_analytics(
  p_period text,
  p_from date,
  p_to date,
  p_category_id uuid default null
)
returns table (
  bucket_start date,
  revenue numeric,
  orders bigint,
  units_sold bigint,
  average_ticket numeric,
  realized_gross_profit numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with buckets as (
    select generate_series(
      public.analytics_bucket_start(p_from, p_period)::timestamp,
      public.analytics_bucket_start(p_to, p_period)::timestamp,
      case p_period
        when 'daily' then interval '1 day'
        when 'weekly' then interval '1 week'
        when 'monthly' then interval '1 month'
        when 'yearly' then interval '1 year'
        else interval '1 day'
      end
    )::date as bucket_start
  ),
  order_facts as (
    select
      o.id,
      public.analytics_bucket_start((o.created_at at time zone 'America/Sao_Paulo')::date, p_period) as bucket_start,
      case
        when p_category_id is null then max(o.total_amount)
        else coalesce(sum(oi.subtotal) filter (where oi.category_id = p_category_id), 0)
      end as revenue,
      coalesce(sum(oi.quantity) filter (where p_category_id is null or oi.category_id = p_category_id), 0) as units_sold,
      coalesce(sum(oi.subtotal - oi.cost_subtotal) filter (where p_category_id is null or oi.category_id = p_category_id), 0) as realized_gross_profit
    from public.orders o
    left join public.order_items oi on oi.order_id = o.id
    where o.status <> 'cancelled'
      and (o.created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
    group by o.id, public.analytics_bucket_start((o.created_at at time zone 'America/Sao_Paulo')::date, p_period)
    having p_category_id is null
      or count(*) filter (where oi.category_id = p_category_id) > 0
  )
  select
    b.bucket_start,
    coalesce(sum(f.revenue), 0)::numeric as revenue,
    count(f.id)::bigint as orders,
    coalesce(sum(f.units_sold), 0)::bigint as units_sold,
    case when count(f.id) > 0 then round(coalesce(sum(f.revenue), 0) / count(f.id), 2) else 0 end::numeric as average_ticket,
    coalesce(sum(f.realized_gross_profit), 0)::numeric as realized_gross_profit
  from buckets b
  left join order_facts f on f.bucket_start = b.bucket_start
  group by b.bucket_start
  order by b.bucket_start;
$$;

create or replace function public.dashboard_product_creation_analytics(
  p_period text,
  p_from date,
  p_to date,
  p_category_id uuid default null
)
returns table (
  bucket_start date,
  products_created bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with buckets as (
    select generate_series(
      public.analytics_bucket_start(p_from, p_period)::timestamp,
      public.analytics_bucket_start(p_to, p_period)::timestamp,
      case p_period
        when 'daily' then interval '1 day'
        when 'weekly' then interval '1 week'
        when 'monthly' then interval '1 month'
        when 'yearly' then interval '1 year'
        else interval '1 day'
      end
    )::date as bucket_start
  ),
  created as (
    select
      public.analytics_bucket_start((p.created_at at time zone 'America/Sao_Paulo')::date, p_period) as bucket_start,
      count(*)::bigint as products_created
    from public.products p
    where (p.created_at at time zone 'America/Sao_Paulo')::date between p_from and p_to
      and (p_category_id is null or p.category_id = p_category_id)
    group by public.analytics_bucket_start((p.created_at at time zone 'America/Sao_Paulo')::date, p_period)
  )
  select b.bucket_start, coalesce(c.products_created, 0)::bigint
  from buckets b
  left join created c on c.bucket_start = b.bucket_start
  order by b.bucket_start;
$$;

create or replace function public.dashboard_snapshot_analytics(
  p_period text,
  p_from date,
  p_to date,
  p_category_id uuid default null
)
returns table (
  bucket_start date,
  stock_units numeric,
  inventory_purchase_value numeric,
  inventory_sale_value numeric,
  estimated_gross_profit numeric,
  completion_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with buckets as (
    select generate_series(
      public.analytics_bucket_start(p_from, p_period)::timestamp,
      public.analytics_bucket_start(p_to, p_period)::timestamp,
      case p_period
        when 'daily' then interval '1 day'
        when 'weekly' then interval '1 week'
        when 'monthly' then interval '1 month'
        when 'yearly' then interval '1 year'
        else interval '1 day'
      end
    )::date as bucket_start
  ),
  source as (
    select
      snapshot_date,
      stock_total_units::numeric as stock_units,
      inventory_purchase_value,
      inventory_sale_value,
      estimated_gross_profit,
      completion_score::numeric
    from public.analytics_daily_snapshots
    where p_category_id is null
      and snapshot_date <= p_to
    union all
    select
      snapshot_date,
      stock_total_units::numeric,
      inventory_purchase_value,
      inventory_sale_value,
      inventory_sale_value - inventory_purchase_value,
      0::numeric
    from public.analytics_category_daily_snapshots
    where p_category_id is not null
      and category_id = p_category_id
      and snapshot_date <= p_to
  )
  select
    b.bucket_start,
    coalesce(latest.stock_units, 0)::numeric,
    coalesce(latest.inventory_purchase_value, 0)::numeric,
    coalesce(latest.inventory_sale_value, 0)::numeric,
    coalesce(latest.estimated_gross_profit, 0)::numeric,
    coalesce(latest.completion_score, 0)::numeric
  from buckets b
  left join lateral (
    select s.*
    from source s
    where s.snapshot_date <= least(
      p_to,
      case p_period
        when 'daily' then b.bucket_start
        when 'weekly' then b.bucket_start + 6
        when 'monthly' then (b.bucket_start + interval '1 month - 1 day')::date
        when 'yearly' then (b.bucket_start + interval '1 year - 1 day')::date
        else b.bucket_start
      end
    )
    order by s.snapshot_date desc
    limit 1
  ) latest on true
  order by b.bucket_start;
$$;

revoke all on function public.dashboard_sales_analytics(text, date, date, uuid) from public;
revoke all on function public.dashboard_product_creation_analytics(text, date, date, uuid) from public;
revoke all on function public.dashboard_snapshot_analytics(text, date, date, uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.dashboard_sales_analytics(text, date, date, uuid) from anon;
    revoke all on function public.dashboard_product_creation_analytics(text, date, date, uuid) from anon;
    revoke all on function public.dashboard_snapshot_analytics(text, date, date, uuid) from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.dashboard_sales_analytics(text, date, date, uuid) from authenticated;
    revoke all on function public.dashboard_product_creation_analytics(text, date, date, uuid) from authenticated;
    revoke all on function public.dashboard_snapshot_analytics(text, date, date, uuid) from authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.dashboard_sales_analytics(text, date, date, uuid) to service_role;
    grant execute on function public.dashboard_product_creation_analytics(text, date, date, uuid) to service_role;
    grant execute on function public.dashboard_snapshot_analytics(text, date, date, uuid) to service_role;
  end if;
end $$;
