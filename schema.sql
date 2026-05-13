-- ═══════════════════════════════════════════════════════════
-- Farmers Factory — Supabase SQL Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension (enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── products ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,
  price       NUMERIC(10,2) NOT NULL,
  old_price   NUMERIC(10,2),
  unit        TEXT,
  description TEXT,
  is_organic  BOOLEAN DEFAULT FALSE,
  image_url   TEXT,
  stock       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── orders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  product_name  TEXT,
  category      TEXT,
  quantity      INTEGER DEFAULT 1,
  location      TEXT,
  phone         TEXT,
  total_price   NUMERIC(10,2) DEFAULT 0,
  status        TEXT DEFAULT 'placed'
                  CHECK (status IN ('placed','packing','out_for_delivery','delivered')),
  delivery_time TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── order_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity     INTEGER DEFAULT 1,
  price        NUMERIC(10,2) DEFAULT 0
);

-- ── otps ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL,
  otp        TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick OTP lookups
CREATE INDEX IF NOT EXISTS idx_otps_email_otp ON otps(email, otp, used);

-- ── Row Level Security ─────────────────────────────────────
-- For simplicity with anon key + client-side auth, enable RLS
-- but allow anon access to these tables.
-- IMPORTANT: In production, add proper RLS policies.

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps        ENABLE ROW LEVEL SECURITY;

-- Allow all access via anon key (for demo/dev — tighten in production)
CREATE POLICY "anon_all_users"       ON users       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_products"    ON products    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_orders"      ON orders      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_order_items" ON order_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_otps"        ON otps        FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Realtime ───────────────────────────────────────────────
-- Enable realtime for products and orders (for live updates)
-- Go to: Supabase → Database → Replication → enable for products, orders

-- ── Storage ────────────────────────────────────────────────
-- Create the product-images storage bucket:
-- Go to: Supabase → Storage → New bucket → Name: "product-images" → Public: ON
-- Then add a policy to allow anon uploads:
-- INSERT INTO storage.objects — allow for anon

-- ── Sample Products ────────────────────────────────────────
INSERT INTO products (name, category, price, old_price, unit, description, is_organic, stock) VALUES
  ('Fresh Tomatoes',      'vegetables', 49, 65,  '500g', 'Farm fresh tomatoes, picked daily', true,  100),
  ('Organic Spinach',     'vegetables', 39, 50,  '250g', 'Tender baby spinach, organically grown', true, 80),
  ('Alphonso Mangoes',    'fruits',     199, 249, '1kg',  'Premium Alphonso mangoes from Ratnagiri', true, 50),
  ('Fresh Coconut Milk',  'dairy',      89, null, '500ml','Cold-pressed coconut milk, no preservatives', true, 60),
  ('Brown Rice',          'grains',     129, 149, '1kg',  'Organic brown rice, high fibre', true, 200),
  ('Tulsi Leaves',        'herbs',      29, null, '100g', 'Fresh tulsi, antibacterial properties', true, 150),
  ('Red Onions',          'vegetables', 35, 45,  '1kg',  'Farm fresh red onions', false, 200),
  ('Bananas',             'fruits',     59, 75,  '1 dozen','Robusta bananas, naturally ripened', false, 120)
ON CONFLICT DO NOTHING;
