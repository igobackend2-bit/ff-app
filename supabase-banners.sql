-- Run this in: supabase.com → project qwiumswrbddwmlraktvy → SQL Editor
-- Creates the banners table so admin can add/edit homepage banners

create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Banner',
  image_url   text not null default '',
  alt_text    text not null default '{}',
  link_url    text,
  position    text not null default 'hero',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.banners disable row level security;
