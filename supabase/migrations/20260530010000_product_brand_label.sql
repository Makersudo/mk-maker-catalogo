alter table public.products
  add column if not exists brand_label text not null default 'MK MAKER';

create index if not exists idx_products_brand_label on public.products(brand_label);
