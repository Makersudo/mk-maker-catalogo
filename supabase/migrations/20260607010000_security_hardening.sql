create table if not exists public.checkout_idempotency_keys (
  idempotency_key text primary key,
  request_hash text not null,
  order_id uuid references public.orders(id) on delete set null,
  response_payload jsonb,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(idempotency_key) between 8 and 128),
  check (char_length(request_hash) = 64)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  method text not null,
  path text not null,
  status_code integer not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_idempotency_expires_at
  on public.checkout_idempotency_keys(expires_at);
create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_logs_admin_email
  on public.admin_audit_logs(admin_email, created_at desc);

drop trigger if exists trg_checkout_idempotency_updated_at on public.checkout_idempotency_keys;
create trigger trg_checkout_idempotency_updated_at
before update on public.checkout_idempotency_keys
for each row execute function public.set_updated_at();

create or replace function public.create_catalog_order(
  p_order jsonb,
  p_items jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_item_rows jsonb;
  v_response jsonb;
  v_existing public.checkout_idempotency_keys%rowtype;
  v_claimed_key text;
  v_updated_id uuid;
  v_quantity integer;
  v_expected_total numeric(12,2);
begin
  if jsonb_typeof(p_order) <> 'object' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Payload de pedido invalido.';
  end if;

  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 40 then
    raise exception 'Quantidade de itens do pedido invalida.';
  end if;

  select round(coalesce(sum((item ->> 'subtotal')::numeric), 0), 2)
  into v_expected_total
  from jsonb_array_elements(p_items) as item;

  if abs(v_expected_total - (p_order ->> 'total_amount')::numeric) > 0.01 then
    raise exception 'Total do pedido invalido.';
  end if;

  if p_idempotency_key is not null then
    if char_length(p_idempotency_key) not between 8 and 128
      or p_request_hash is null
      or char_length(p_request_hash) <> 64 then
      raise exception 'Idempotency-Key invalido.';
    end if;

    insert into public.checkout_idempotency_keys (idempotency_key, request_hash)
    values (p_idempotency_key, p_request_hash)
    on conflict (idempotency_key) do nothing
    returning idempotency_key into v_claimed_key;

    if v_claimed_key is null then
      select *
      into v_existing
      from public.checkout_idempotency_keys
      where idempotency_key = p_idempotency_key
      for update;

      if v_existing.request_hash <> p_request_hash then
        raise exception 'Idempotency-Key reutilizado com outro pedido.';
      end if;

      if v_existing.response_payload is null then
        raise exception 'Pedido equivalente ainda esta em processamento.';
      end if;

      return v_existing.response_payload || jsonb_build_object('replayed', true);
    end if;
  end if;

  insert into public.orders (
    order_code,
    customer_name,
    customer_phone,
    fulfillment_type,
    payment_method,
    cep,
    address,
    number,
    complement,
    neighborhood,
    region,
    city,
    state,
    reference_point,
    total_amount,
    status
  )
  values (
    p_order ->> 'order_code',
    p_order ->> 'customer_name',
    p_order ->> 'customer_phone',
    p_order ->> 'fulfillment_type',
    p_order ->> 'payment_method',
    p_order ->> 'cep',
    p_order ->> 'address',
    p_order ->> 'number',
    p_order ->> 'complement',
    p_order ->> 'neighborhood',
    p_order ->> 'region',
    p_order ->> 'city',
    p_order ->> 'state',
    p_order ->> 'reference_point',
    (p_order ->> 'total_amount')::numeric,
    p_order ->> 'status'
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then
      raise exception 'Quantidade invalida.';
    end if;

    v_updated_id := null;
    if nullif(v_item ->> 'product_variant_id', '') is not null then
      update public.product_variants as variant
      set
        stock_quantity = variant.stock_quantity - v_quantity,
        updated_at = now()
      from public.products as product
      where variant.id = (v_item ->> 'product_variant_id')::uuid
        and variant.product_id = (v_item ->> 'product_id')::uuid
        and product.id = variant.product_id
        and product.is_active = true
        and product.catalog_status = 'live'
        and variant.is_active = true
        and variant.stock_quantity >= v_quantity
      returning variant.id into v_updated_id;
    else
      update public.products as product
      set
        stock_quantity = product.stock_quantity - v_quantity,
        updated_at = now()
      where product.id = (v_item ->> 'product_id')::uuid
        and product.is_active = true
        and product.catalog_status = 'live'
        and product.variants_enabled = false
        and product.stock_quantity >= v_quantity
      returning product.id into v_updated_id;
    end if;

    if v_updated_id is null then
      raise exception 'Estoque insuficiente ou produto indisponivel.';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_variant_id,
      product_name,
      variant_label,
      variant_options,
      unit_price,
      quantity,
      subtotal,
      unit_purchase_cost,
      cost_subtotal,
      category_id,
      category_name,
      subcategory_id,
      subcategory_name
    )
    values (
      v_order.id,
      (v_item ->> 'product_id')::uuid,
      nullif(v_item ->> 'product_variant_id', '')::uuid,
      v_item ->> 'product_name',
      v_item ->> 'variant_label',
      coalesce(v_item -> 'variant_options', '[]'::jsonb),
      (v_item ->> 'unit_price')::numeric,
      v_quantity,
      (v_item ->> 'subtotal')::numeric,
      coalesce((v_item ->> 'unit_purchase_cost')::numeric, 0),
      coalesce((v_item ->> 'cost_subtotal')::numeric, 0),
      nullif(v_item ->> 'category_id', '')::uuid,
      v_item ->> 'category_name',
      nullif(v_item ->> 'subcategory_id', '')::uuid,
      v_item ->> 'subcategory_name'
    );
  end loop;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.created_at), '[]'::jsonb)
  into v_item_rows
  from public.order_items as item
  where item.order_id = v_order.id;

  v_response := jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_item_rows,
    'replayed', false
  );

  if p_idempotency_key is not null then
    update public.checkout_idempotency_keys
    set
      order_id = v_order.id,
      response_payload = v_response,
      updated_at = now()
    where idempotency_key = p_idempotency_key;
  end if;

  return v_response;
end;
$$;

do $$
declare
  table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
