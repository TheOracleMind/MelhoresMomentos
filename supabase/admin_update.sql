create table if not exists public.admin_users (
  singleton_key boolean primary key default true,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint admin_users_singleton check (singleton_key = true)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('landing_view', 'create_started', 'offer_view')),
  visitor_id text,
  user_id uuid references auth.users(id) on delete set null,
  love_page_id uuid references public.love_pages(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_visitor_id_idx on public.analytics_events(visitor_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);

create table if not exists public.funnel_splits (
  id uuid primary key default gen_random_uuid(),
  reason text not null default '',
  landing_views int not null default 0,
  create_started int not null default 0,
  offer_views int not null default 0,
  purchases int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists funnel_splits_created_at_idx on public.funnel_splits(created_at desc);

alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;
alter table public.funnel_splits enable row level security;
