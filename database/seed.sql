insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Masculina', 'masculina', null, 10, true),
  ('Feminina', 'feminina', null, 20, true)
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

with roots as (
  select id, slug from public.categories where slug in ('masculina', 'feminina')
)
insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Camisetas', 'masculina-camisetas', (select id from roots where slug = 'masculina'), 10, true),
  ('Regatas', 'masculina-regatas', (select id from roots where slug = 'masculina'), 20, true),
  ('Shorts', 'masculina-shorts', (select id from roots where slug = 'masculina'), 30, true),
  ('Calcas', 'masculina-calcas', (select id from roots where slug = 'masculina'), 40, true),
  ('Acessorios', 'masculina-acessorios', (select id from roots where slug = 'masculina'), 50, true),
  ('Tops', 'feminina-tops', (select id from roots where slug = 'feminina'), 10, true),
  ('Leggings', 'feminina-leggings', (select id from roots where slug = 'feminina'), 20, true),
  ('Shorts', 'feminina-shorts', (select id from roots where slug = 'feminina'), 30, true),
  ('Conjuntos', 'feminina-conjuntos', (select id from roots where slug = 'feminina'), 40, true),
  ('Acessorios', 'feminina-acessorios', (select id from roots where slug = 'feminina'), 50, true)
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.settings (key, value, is_public)
values
  ('store_name', 'MK MAKER', true),
  ('whatsapp_phone', '', true)
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public;
