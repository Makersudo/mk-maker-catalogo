create table if not exists public.catalog_config (
  id boolean primary key default true check (id = true),
  store_name text not null default 'MK MAKER',
  store_slug text not null default 'mk-maker',
  logo_url text,
  banner_url text,
  primary_color text not null default '#d68a00',
  secondary_color text not null default '#111827',
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

insert into public.catalog_config (
  id,
  store_name,
  store_slug,
  logo_url,
  banner_url,
  primary_color,
  secondary_color,
  whatsapp_phone,
  plan_code
)
values (
  true,
  coalesce((select value from public.settings where key = 'store_name'), 'MK MAKER'),
  coalesce((select value from public.settings where key = 'store_slug'), 'mk-maker'),
  (select value from public.settings where key = 'store_logo'),
  (select value from public.settings where key = 'store_banner'),
  coalesce((select value from public.settings where key = 'store_primary_color'), '#d68a00'),
  coalesce((select value from public.settings where key = 'store_secondary_color'), '#111827'),
  (select value from public.settings where key = 'whatsapp_phone'),
  coalesce((select value from public.settings where key = 'store_plan'), 'medium')
)
on conflict (id) do nothing;

alter table public.catalog_config enable row level security;

drop policy if exists "Public can read active catalog config" on public.catalog_config;
create policy "Public can read active catalog config"
on public.catalog_config for select
using (is_active = true);

drop trigger if exists trg_catalog_config_updated_at on public.catalog_config;
create trigger trg_catalog_config_updated_at
before update on public.catalog_config
for each row execute function public.set_updated_at();
