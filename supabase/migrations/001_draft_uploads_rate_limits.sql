-- Tracks every draft-phase image upload so we can:
-- 1. Rate-limit uploads per draft token (5/min)
-- 2. Mark images as "claimed" when the user creates an account
-- 3. Clean up unclaimed images older than 6 hours via cron
create table if not exists public.draft_uploads (
  id uuid primary key default gen_random_uuid(),
  draft_token text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists draft_uploads_token_created_at_idx
  on public.draft_uploads(draft_token, created_at desc);

-- Partial index for the cleanup job (only unclaimed rows)
create index if not exists draft_uploads_unclaimed_created_at_idx
  on public.draft_uploads(created_at)
  where claimed_at is null;

-- Sliding-window rate limiting for non-upload endpoints (checkout, admin, etc.)
-- Rows are cleaned up hourly by the cleanup cron job
create table if not exists public.rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_attempts_key_created_at_idx
  on public.rate_limit_attempts(key, created_at desc);
