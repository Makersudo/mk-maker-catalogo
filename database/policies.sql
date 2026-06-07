alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.media_files enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.catalog_config enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.analytics_daily_snapshots enable row level security;
alter table public.analytics_category_daily_snapshots enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (is_active = true and catalog_status = 'live');

drop policy if exists "Public can read images for active products" on public.product_images;
create policy "Public can read images for active products"
on public.product_images for select
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
    and products.is_active = true
    and products.catalog_status = 'live'
  )
);

drop policy if exists "Public can read public settings" on public.settings;
create policy "Public can read public settings"
on public.settings for select
using (is_public = true);

drop policy if exists "Public can read active catalog config" on public.catalog_config;
create policy "Public can read active catalog config"
on public.catalog_config for select
using (is_active = true);

-- Escritas administrativas devem passar pelo backend com service role.
-- Segredos administrativos e gate tokens ficam em settings com is_public=false.

revoke all on function public.decrement_inventory_stock(text, uuid, integer) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.decrement_inventory_stock(text, uuid, integer) from anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.decrement_inventory_stock(text, uuid, integer) from authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.decrement_inventory_stock(text, uuid, integer) to service_role;
  end if;
end $$;

