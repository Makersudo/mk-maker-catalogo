-- Criação da tabela de Licenciamento dos Catálogos dos Clientes
create table if not exists public.catalog_licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  client_name text not null,
  domain text,
  active boolean not null default true,
  message text,
  support_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habilita RLS (Row Level Security)
alter table public.catalog_licenses enable row level security;

-- Política de Segurança: Qualquer pessoa (público) pode consultar se uma licença está ativa
drop policy if exists "Allow public read catalog_licenses" on public.catalog_licenses;
create policy "Allow public read catalog_licenses"
  on public.catalog_licenses for select
  using (true);

-- Permissões de acesso
grant select on public.catalog_licenses to anon, authenticated;
grant all on public.catalog_licenses to service_role;
