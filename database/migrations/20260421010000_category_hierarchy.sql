alter table public.categories
add column if not exists parent_id uuid references public.categories(id) on delete restrict;

alter table public.products
add column if not exists subcategory_id uuid references public.categories(id) on delete set null;

create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_products_subcategory_id on public.products(subcategory_id);

-- MK Maker category seeds are inserted by backend/src/scripts/importMasterCatalog.ts.
