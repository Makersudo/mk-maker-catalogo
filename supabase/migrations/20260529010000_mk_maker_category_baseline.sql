alter table public.categories
add column if not exists parent_id uuid references public.categories(id) on delete restrict;

alter table public.products
add column if not exists subcategory_id uuid references public.categories(id) on delete set null;

create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_products_subcategory_id on public.products(subcategory_id);

insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Maquiagem', 'maquiagem', null, 10, true),
  ('Skincare', 'skincare', null, 20, true)
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

with roots as (
  select id, slug from public.categories where slug in ('maquiagem', 'skincare')
),
seed_subcategories(name, slug, root_slug, sort_order) as (
  values
    ('Batons', 'maquiagem-batons', 'maquiagem', 10),
    ('Olhos', 'maquiagem-olhos', 'maquiagem', 20),
    ('Rosto', 'maquiagem-rosto', 'maquiagem', 30),
    ('Pinceis e Acessorios', 'maquiagem-pinceis-acessorios', 'maquiagem', 40),
    ('Cuidados com a Pele', 'skincare-cuidados-com-a-pele', 'skincare', 10)
)
insert into public.categories (name, slug, parent_id, sort_order, is_active)
select seed.name, seed.slug, roots.id, seed.sort_order, true
from seed_subcategories seed
join roots on roots.slug = seed.root_slug
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;
