-- ═══════════════════════════════════════════════════════════════════
-- Farmers Factory — Complete Supabase Schema
-- Run this in: Supabase → SQL Editor → New Query → Run All
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop existing tables (clean slate) ──────────────────────────────
DROP TABLE IF EXISTS wishlist_items  CASCADE;
DROP TABLE IF EXISTS reviews         CASCADE;
DROP TABLE IF EXISTS order_items     CASCADE;
DROP TABLE IF EXISTS orders          CASCADE;
DROP TABLE IF EXISTS cart_items      CASCADE;
DROP TABLE IF EXISTS carts           CASCADE;
DROP TABLE IF EXISTS inventory       CASCADE;
DROP TABLE IF EXISTS products        CASCADE;
DROP TABLE IF EXISTS brands          CASCADE;
DROP TABLE IF EXISTS categories      CASCADE;
DROP TABLE IF EXISTS dark_stores     CASCADE;
DROP TABLE IF EXISTS coupons         CASCADE;
DROP TABLE IF EXISTS banners         CASCADE;
DROP TABLE IF EXISTS addresses       CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions        CASCADE;
DROP TABLE IF EXISTS accounts        CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
DROP TABLE IF EXISTS otps            CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;

-- ── users ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone          TEXT UNIQUE,
  email          TEXT UNIQUE,
  name           TEXT,
  avatar_url     TEXT,
  referral_code  TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  referred_by    TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── accounts (OAuth) ────────────────────────────────────────────────
CREATE TABLE accounts (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE(provider, provider_account_id)
);

-- ── sessions ─────────────────────────────────────────────────────────
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT UNIQUE NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

-- ── verification_tokens (OTP) ────────────────────────────────────────
CREATE TABLE verification_tokens (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(identifier, token)
);

-- ── addresses ────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  line1      TEXT NOT NULL,
  line2      TEXT,
  landmark   TEXT,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  pincode    TEXT NOT NULL,
  lat        DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng        DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── dark_stores ──────────────────────────────────────────────────────
CREATE TABLE dark_stores (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  pincode      TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng          DOUBLE PRECISION NOT NULL DEFAULT 0,
  radius_km    DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  phone_number TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insert default store so orders don't fail
INSERT INTO dark_stores (id, name, city, pincode, lat, lng)
VALUES ('default-store', 'Farmers Factory HQ', 'Mumbai', '400001', 19.0760, 72.8777);

-- ── categories ───────────────────────────────────────────────────────
CREATE TABLE categories (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  image_url        TEXT NOT NULL DEFAULT '',
  icon_url         TEXT,
  parent_id        TEXT REFERENCES categories(id),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  meta_title       TEXT,
  meta_description TEXT,
  og_image_url     TEXT
);

-- ── brands ───────────────────────────────────────────────────────────
CREATE TABLE brands (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name     TEXT NOT NULL,
  slug     TEXT UNIQUE NOT NULL,
  logo_url TEXT
);

-- ── products ─────────────────────────────────────────────────────────
CREATE TABLE products (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  image_urls       TEXT NOT NULL DEFAULT '[]',    -- JSON array string
  blur_data_urls   TEXT NOT NULL DEFAULT '[]',
  category_id      TEXT NOT NULL REFERENCES categories(id),
  category_slug    TEXT NOT NULL DEFAULT '',      -- denormalised for fast filtering
  brand_id         TEXT REFERENCES brands(id),
  sku              TEXT UNIQUE NOT NULL,
  barcode          TEXT,
  mrp              DOUBLE PRECISION NOT NULL,
  price            DOUBLE PRECISION NOT NULL,
  unit             TEXT NOT NULL,
  tags             TEXT NOT NULL DEFAULT '[]',    -- JSON array string
  attributes       TEXT,                          -- JSON object string
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  in_stock         BOOLEAN NOT NULL DEFAULT TRUE,
  meta_title       TEXT,
  meta_description TEXT,
  average_rating   DOUBLE PRECISION NOT NULL DEFAULT 0,
  review_count     INTEGER NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_slug ON products(category_slug);
CREATE INDEX idx_products_is_active     ON products(is_active);
CREATE INDEX idx_products_is_featured   ON products(is_featured);
CREATE INDEX idx_products_in_stock      ON products(in_stock);
CREATE INDEX idx_products_name          ON products USING gin(to_tsvector('english', name));

-- ── inventory ────────────────────────────────────────────────────────
CREATE TABLE inventory (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id    TEXT NOT NULL REFERENCES products(id),
  dark_store_id TEXT NOT NULL REFERENCES dark_stores(id),
  quantity      INTEGER NOT NULL DEFAULT 0,
  threshold     INTEGER NOT NULL DEFAULT 10,
  UNIQUE(product_id, dark_store_id)
);

-- ── carts ────────────────────────────────────────────────────────────
CREATE TABLE carts (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── cart_items ───────────────────────────────────────────────────────
CREATE TABLE cart_items (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cart_id    TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);

-- ── orders ───────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number          TEXT UNIQUE NOT NULL,
  user_id               TEXT NOT NULL REFERENCES users(id),
  address_id            TEXT NOT NULL REFERENCES addresses(id),
  dark_store_id         TEXT NOT NULL DEFAULT 'default-store' REFERENCES dark_stores(id),
  status                TEXT NOT NULL DEFAULT 'PLACED',
  payment_status        TEXT NOT NULL DEFAULT 'PENDING',
  payment_method        TEXT,
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  subtotal              DOUBLE PRECISION NOT NULL,
  delivery_fee          DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount              DOUBLE PRECISION NOT NULL DEFAULT 0,
  total                 DOUBLE PRECISION NOT NULL,
  coupon_code           TEXT,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancel_reason         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ── order_items ──────────────────────────────────────────────────────
CREATE TABLE order_items (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total      DOUBLE PRECISION NOT NULL
);

-- ── reviews ──────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ── wishlist_items ───────────────────────────────────────────────────
CREATE TABLE wishlist_items (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Alias view so lib/supabase.ts can query "wishlists" table name
CREATE VIEW wishlists AS SELECT * FROM wishlist_items;

-- ── coupons ──────────────────────────────────────────────────────────
CREATE TABLE coupons (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code            TEXT UNIQUE NOT NULL,
  type            TEXT NOT NULL,   -- 'percent' | 'flat'
  value           DOUBLE PRECISION NOT NULL,
  min_order_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  max_discount    DOUBLE PRECISION,
  usage_limit     INTEGER,
  used_count      INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ NOT NULL
);

-- ── banners ──────────────────────────────────────────────────────────
CREATE TABLE banners (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  alt_text    TEXT NOT NULL,
  link_url    TEXT,
  position    TEXT NOT NULL DEFAULT 'hero',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from  TIMESTAMPTZ,
  valid_until TIMESTAMPTZ
);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_stores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory            ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners              ENABLE ROW LEVEL SECURITY;

-- Public read: products, categories, brands, banners, dark_stores
CREATE POLICY "public_read_products"    ON products    FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_categories"  ON categories  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_brands"      ON brands      FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_banners"     ON banners     FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_dark_stores" ON dark_stores FOR SELECT TO anon USING (is_active = true);

-- Service role (server-side) gets full access to everything
CREATE POLICY "service_all_users"       ON users       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_accounts"    ON accounts    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sessions"    ON sessions    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_vtokens"     ON verification_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_addresses"   ON addresses   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_products"    ON products    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_categories"  ON categories  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_brands"      ON brands      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_carts"       ON carts       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_cart_items"  ON cart_items  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_orders"      ON orders      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_order_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_reviews"     ON reviews     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_wishlists"   ON wishlist_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_coupons"     ON coupons     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_banners"     ON banners     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_inventory"   ON inventory   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_darkstores"  ON dark_stores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon write for auth flow (OTP login creates users/tokens via server-side API)
CREATE POLICY "anon_read_vtokens" ON verification_tokens FOR SELECT TO anon USING (true);

-- ── updated_at auto-trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_updated_at  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_updated_at    BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER carts_updated_at     BEFORE UPDATE ON carts     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Sample categories ────────────────────────────────────────────────
INSERT INTO categories (id, name, slug, image_url, icon_url, sort_order) VALUES
  ('cat-vegetables', 'Vegetables',    'vegetables', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', '', 1),
  ('cat-fruits',     'Fruits',        'fruits',     'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', '', 2),
  ('cat-dairy',      'Dairy & Eggs',  'dairy',      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', '', 3),
  ('cat-grains',     'Grains & Rice', 'grains',     'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', '', 4),
  ('cat-herbs',      'Herbs & Spices','herbs',      'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=400', '', 5),
  ('cat-snacks',     'Snacks',        'snacks',     'https://images.unsplash.com/photo-1613843596759-7d3e3a3b5f44?w=400', '', 6)
ON CONFLICT (slug) DO NOTHING;

-- ── Sample products ──────────────────────────────────────────────────
INSERT INTO products (id, name, slug, description, image_urls, category_id, category_slug, sku, mrp, price, unit, is_featured, in_stock, is_active, tags) VALUES
  ('prod-001', 'Fresh Tomatoes',    'fresh-tomatoes',    'Farm fresh tomatoes, picked daily',             '["https://images.unsplash.com/photo-1546470427-e26264be0b0c?w=400"]', 'cat-vegetables', 'vegetables', 'VEG-TOM-001', 65,  49,  '500g', true,  true, true, '["organic","fresh","daily"]'),
  ('prod-002', 'Organic Spinach',   'organic-spinach',   'Tender baby spinach, organically grown',        '["https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400"]', 'cat-vegetables', 'vegetables', 'VEG-SPN-001', 50,  39,  '250g', true,  true, true, '["organic","leafy"]'),
  ('prod-003', 'Alphonso Mangoes',  'alphonso-mangoes',  'Premium Alphonso mangoes from Ratnagiri',       '["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400"]', 'cat-fruits',     'fruits',     'FRT-MNG-001', 249, 199, '1kg',  true,  true, true, '["seasonal","premium"]'),
  ('prod-004', 'Red Onions',        'red-onions',        'Farm fresh red onions',                         '["https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400"]', 'cat-vegetables', 'vegetables', 'VEG-ONI-001', 45,  35,  '1kg',  false, true, true, '["staple"]'),
  ('prod-005', 'Bananas',           'bananas',           'Robusta bananas, naturally ripened',            '["https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400"]', 'cat-fruits',     'fruits',     'FRT-BAN-001', 75,  59,  '1 dozen', false, true, true, '["fresh"]'),
  ('prod-006', 'Brown Rice',        'brown-rice',        'Organic brown rice, high fibre',                '["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"]', 'cat-grains',     'grains',     'GRN-RIC-001', 149, 129, '1kg',  false, true, true, '["organic","healthy"]'),
  ('prod-007', 'Fresh Coconut Milk','fresh-coconut-milk','Cold-pressed coconut milk, no preservatives',  '["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"]', 'cat-dairy',      'dairy',      'DAI-COC-001', 99,  89,  '500ml',true,  true, true, '["vegan","fresh"]'),
  ('prod-008', 'Tulsi Leaves',      'tulsi-leaves',      'Fresh tulsi, antibacterial properties',         '["https://images.unsplash.com/photo-1591291621164-2c6367723315?w=400"]', 'cat-herbs',      'herbs',      'HRB-TUL-001', 29,  25,  '100g', false, true, true, '["medicinal","fresh"]')
ON CONFLICT (slug) DO NOTHING;

-- ── Sample banner ────────────────────────────────────────────────────
INSERT INTO banners (title, image_url, alt_text, link_url, position, sort_order, is_active) VALUES
  ('Fresh from the Farm', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1024', 'Fresh vegetables banner', '/categories/vegetables', 'hero', 1, true),
  ('Organic Fruits Sale', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1024', 'Fruits sale banner', '/categories/fruits', 'hero', 2, true)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- DONE! Your Farmers Factory database is ready.
-- Tables created: users, categories, brands, products, inventory,
--   carts, cart_items, orders, order_items, reviews, wishlist_items,
--   coupons, banners, addresses, verification_tokens, sessions, accounts
-- ════════════════════════════════════════════════════════════════════
