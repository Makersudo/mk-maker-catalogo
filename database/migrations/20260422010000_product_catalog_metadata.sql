alter table public.products
add column if not exists slug text,
add column if not exists audience text check (audience is null or audience in ('beleza')),
add column if not exists product_type text,
add column if not exists variation text,
add column if not exists features jsonb not null default '[]'::jsonb,
add column if not exists image_prompt text,
add column if not exists catalog_status text not null default 'draft' check (catalog_status in ('draft', 'ready', 'live'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_slug_key'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_slug_key unique (slug);
  end if;
end $$;
