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
)
insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Batons', 'maquiagem-batons', (select id from roots where slug = 'maquiagem'), 10, true),
  ('Olhos', 'maquiagem-olhos', (select id from roots where slug = 'maquiagem'), 20, true),
  ('Rosto', 'maquiagem-rosto', (select id from roots where slug = 'maquiagem'), 30, true),
  ('Pinceis e Acessorios', 'maquiagem-pinceis-acessorios', (select id from roots where slug = 'maquiagem'), 40, true),
  ('Cuidados com a Pele', 'skincare-cuidados-com-a-pele', (select id from roots where slug = 'skincare'), 10, true)
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
