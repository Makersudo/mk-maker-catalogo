alter table public.products
add column if not exists purchase_cost numeric(12,2) not null default 0 check (purchase_cost >= 0);

create index if not exists idx_products_purchase_cost on public.products(purchase_cost);
