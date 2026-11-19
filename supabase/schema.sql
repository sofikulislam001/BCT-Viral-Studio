-- Run this entire script in Supabase -> SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.bct_posts (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  caption text not null,
  image_url text not null,
  status text not null default 'pending'
    check (status in ('pending','scheduled','published','failed','rejected')),
  scheduled_at timestamptz,
  published_at timestamptz,
  facebook_post_id text,
  source text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists bct_posts_status_schedule_idx
  on public.bct_posts(status, scheduled_at);

create table if not exists public.bct_settings (
  id integer primary key default 1 check (id = 1),
  automation_enabled boolean not null default false,
  photo_enabled boolean not null default true,
  daily_limit integer not null default 2 check (daily_limit between 1 and 20),
  approval_required boolean not null default true,
  timezone text not null default 'Asia/Dhaka',
  posting_times text[] not null default array['10:00','20:00'],
  updated_at timestamptz not null default now()
);

insert into public.bct_settings (id) values (1)
on conflict (id) do nothing;

-- Storage: create a PUBLIC bucket named bct-memes in Supabase Storage.
-- Images are uploaded server-side using the service role key.


-- Prevent the same trend headline from being auto-generated repeatedly.
create table if not exists public.bct_trend_runs (
  id uuid primary key default gen_random_uuid(),
  trend_title text not null unique,
  created_at timestamptz not null default now()
);

-- Lock both tables down. The app uses the service role key (which bypasses RLS)
-- on the server only; no public/anon access is needed.
alter table public.bct_posts enable row level security;
alter table public.bct_settings enable row level security;
alter table public.bct_trend_runs enable row level security;
