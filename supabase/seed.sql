insert into public.categories (name, slug, sort_order, is_active)
values
  ('Roupas Masculinas', 'roupas-masculinas', 10, true),
  ('Roupas Femininas', 'roupas-femininas', 20, true),
  ('Conjuntos Performance', 'conjuntos', 30, true),
  ('Suplementos', 'suplementos', 40, true),
  ('Acessorios de Treino', 'acessorios', 50, true)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.settings (key, value, is_public)
values
  ('store_name', 'MK MAKER', true),
  ('whatsapp_phone', '', true)
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public;
