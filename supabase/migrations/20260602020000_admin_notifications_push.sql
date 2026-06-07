create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('new_order')),
  title text not null,
  message text not null,
  order_id uuid references public.orders(id) on delete cascade,
  order_code text,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_unread_created_at
  on public.notifications(is_read, created_at desc);

create index if not exists idx_notifications_order_id
  on public.notifications(order_id);

create index if not exists idx_push_subscriptions_active
  on public.push_subscriptions(is_active);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();
