create extension if not exists "pgcrypto";

do $$ begin
  create type public.page_status as enum ('draft', 'pending_payment', 'active', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.relationship_type as enum ('namoro', 'noivado', 'casamento', 'outro');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.page_theme as enum ('classic', 'minimal', 'romantic');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_type as enum ('initial_24h', 'initial_365d', 'renewal_24h', 'renewal_365d');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.love_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_email text,
  slug text not null unique,
  creator_name text not null default '',
  recipient_name text not null default '',
  relationship_type public.relationship_type not null default 'outro',
  met_at date,
  relationship_started_at date,
  short_message text,
  title text not null default '',
  intro_message text not null default '',
  final_message text not null default '',
  main_photo_url text,
  theme public.page_theme not null default 'classic',
  status public.page_status not null default 'draft',
  plan_type public.payment_type,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.love_pages alter column user_id drop not null;
alter table public.love_pages add column if not exists owner_email text;

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  love_page_id uuid not null references public.love_pages(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  moment_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moment_images (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.best_photos (
  id uuid primary key default gen_random_uuid(),
  love_page_id uuid not null references public.love_pages(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  love_page_id uuid not null references public.love_pages(id) on delete cascade,
  stripe_session_id text not null unique,
  payment_type public.payment_type not null,
  amount int not null,
  paid_at timestamptz not null default now()
);

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

create table if not exists public.funnel_splits (
  id uuid primary key default gen_random_uuid(),
  reason text not null default '',
  landing_views int not null default 0,
  create_started int not null default 0,
  offer_views int not null default 0,
  purchases int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists love_pages_user_id_idx on public.love_pages(user_id);
create index if not exists love_pages_owner_email_idx on public.love_pages(owner_email);
create index if not exists love_pages_slug_idx on public.love_pages(slug);
create index if not exists love_pages_expires_at_idx on public.love_pages(expires_at);
create index if not exists moments_love_page_id_idx on public.moments(love_page_id);
create index if not exists moment_images_moment_id_idx on public.moment_images(moment_id);
create index if not exists best_photos_love_page_id_idx on public.best_photos(love_page_id);
create index if not exists payments_love_page_id_idx on public.payments(love_page_id);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_visitor_id_idx on public.analytics_events(visitor_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
create index if not exists funnel_splits_created_at_idx on public.funnel_splits(created_at desc);

create table if not exists public.draft_uploads (
  id uuid primary key default gen_random_uuid(),
  draft_token text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists draft_uploads_token_created_at_idx
  on public.draft_uploads(draft_token, created_at desc);

create index if not exists draft_uploads_unclaimed_created_at_idx
  on public.draft_uploads(created_at)
  where claimed_at is null;

create table if not exists public.rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_attempts_key_created_at_idx
  on public.rate_limit_attempts(key, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_love_pages_updated_at on public.love_pages;
create trigger set_love_pages_updated_at
before update on public.love_pages
for each row execute function public.set_updated_at();

drop trigger if exists set_moments_updated_at on public.moments;
create trigger set_moments_updated_at
before update on public.moments
for each row execute function public.set_updated_at();

alter table public.love_pages enable row level security;
alter table public.moments enable row level security;
alter table public.moment_images enable row level security;
alter table public.best_photos enable row level security;
alter table public.payments enable row level security;
alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;
alter table public.funnel_splits enable row level security;

drop policy if exists "Users can read own pages" on public.love_pages;
create policy "Users can read own pages"
on public.love_pages for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own pages" on public.love_pages;
create policy "Users can create own pages"
on public.love_pages for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own pages" on public.love_pages;
create policy "Users can update own pages"
on public.love_pages for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own pages" on public.love_pages;
create policy "Users can delete own pages"
on public.love_pages for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can manage own moments" on public.moments;
create policy "Users can manage own moments"
on public.moments for all
to authenticated
using (
  exists (
    select 1 from public.love_pages
    where love_pages.id = moments.love_page_id
      and love_pages.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.love_pages
    where love_pages.id = moments.love_page_id
      and love_pages.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own moment images" on public.moment_images;
create policy "Users can manage own moment images"
on public.moment_images for all
to authenticated
using (
  exists (
    select 1
    from public.moments
    join public.love_pages on love_pages.id = moments.love_page_id
    where moments.id = moment_images.moment_id
      and love_pages.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.moments
    join public.love_pages on love_pages.id = moments.love_page_id
    where moments.id = moment_images.moment_id
      and love_pages.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own best photos" on public.best_photos;
create policy "Users can manage own best photos"
on public.best_photos for all
to authenticated
using (
  exists (
    select 1 from public.love_pages
    where love_pages.id = best_photos.love_page_id
      and love_pages.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.love_pages
    where love_pages.id = best_photos.love_page_id
      and love_pages.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
on public.payments for select
to authenticated
using (
  exists (
    select 1 from public.love_pages
    where love_pages.id = payments.love_page_id
      and love_pages.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gift-images',
  'gift-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own image objects" on storage.objects;
create policy "Users can read own image objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'gift-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own image objects" on storage.objects;
create policy "Users can upload own image objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gift-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own image objects" on storage.objects;
create policy "Users can update own image objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'gift-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'gift-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own image objects" on storage.objects;
create policy "Users can delete own image objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gift-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.expire_love_pages()
returns void
language sql
security definer
as $$
  update public.love_pages
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
$$;
