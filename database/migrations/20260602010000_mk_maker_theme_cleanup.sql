alter table public.products
drop constraint if exists products_audience_check;

update public.products
set audience = 'beleza'
where audience in ('feminino', 'masculino', 'suplemento');

alter table public.products
add constraint products_audience_check
check (audience is null or audience in ('beleza'));

update public.categories
set is_active = false,
    updated_at = now()
where slug in (
  'masculina',
  'feminina',
  'masculina-camisetas',
  'masculina-regatas',
  'masculina-shorts',
  'masculina-calcas',
  'masculina-acessorios',
  'feminina-tops',
  'feminina-leggings',
  'feminina-shorts',
  'feminina-conjuntos',
  'feminina-acessorios',
  'roupas-masculinas',
  'roupas-femininas',
  'conjuntos',
  'suplementos',
  'acessorios'
);
