-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard → your project → SQL Editor

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  order_number     text not null unique,
  customer_name    text,
  customer_phone   text,
  subtotal         numeric(10,2) not null default 0,
  delivery_fee     numeric(10,2) not null default 0,
  total_amount     numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  delivery_address text,
  delivery_pincode text,
  payment_method   text not null default 'cod',
  payment_status   text not null default 'unpaid',
  status           text not null default 'PLACED',
  source           text default 'app',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   text,
  product_name text,
  quantity     int not null default 1,
  unit_price   numeric(10,2) not null default 0,
  total        numeric(10,2) not null default 0,
  created_at   timestamptz not null default now()
);

-- Disable RLS so service role key can read/write freely
alter table orders     disable row level security;
alter table order_items disable row level security;

-- Index for fast user lookups
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
