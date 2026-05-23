-- ============================================================
-- FARMERS FACTORY — Supabase Schema + Seed Data
-- Paste this entire file into Supabase > SQL Editor > Run
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Drop existing tables (clean slate) ───────────────────────
drop table if exists wishlists cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists addresses cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists brands cascade;
drop table if exists users cascade;
drop table if exists dark_stores cascade;

-- ── DARK STORES ───────────────────────────────────────────────
create table dark_stores (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  city        text not null,
  pincode     text not null,
  lat         double precision not null,
  lng         double precision not null,
  radius_km   integer not null default 50,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── BRANDS ───────────────────────────────────────────────────
create table brands (
  id        text primary key default gen_random_uuid()::text,
  name      text not null,
  slug      text not null unique,
  logo_url  text,
  created_at timestamptz not null default now()
);

-- ── CATEGORIES ───────────────────────────────────────────────
create table categories (
  id               text primary key default gen_random_uuid()::text,
  name             text not null,
  slug             text not null unique,
  description      text,
  image_url        text not null default '',
  icon_url         text,
  parent_id        text references categories(id),
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  meta_title       text,
  meta_description text,
  og_image_url     text,
  created_at       timestamptz not null default now()
);

-- ── PRODUCTS ─────────────────────────────────────────────────
create table products (
  id               text primary key default gen_random_uuid()::text,
  name             text not null,
  slug             text not null unique,
  description      text,
  image_urls       jsonb not null default '[]',
  blur_data_urls   jsonb not null default '[]',
  category_id      text not null references categories(id),
  category_slug    text not null,
  brand_id         text references brands(id),
  sku              text not null unique,
  mrp              numeric(10,2) not null,
  price            numeric(10,2) not null,
  unit             text not null,
  tags             jsonb not null default '[]',
  is_featured      boolean not null default false,
  in_stock         boolean not null default true,
  average_rating   numeric(3,2) not null default 0,
  review_count     integer not null default 0,
  meta_title       text,
  meta_description text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── USERS ────────────────────────────────────────────────────
create table users (
  id             text primary key,   -- matches Supabase auth.users.id
  name           text,
  phone          text unique,
  email          text unique,
  avatar_url     text,
  referral_code  text unique,
  loyalty_points integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── ADDRESSES ────────────────────────────────────────────────
create table addresses (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  label      text not null default 'Home',
  line1      text not null,
  line2      text,
  landmark   text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  lat        double precision,
  lng        double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── ORDERS ───────────────────────────────────────────────────
create table orders (
  id                    text primary key default gen_random_uuid()::text,
  order_number          text not null unique,
  user_id               text not null references users(id),
  address_id            text references addresses(id),
  status                text not null default 'PLACED'
                        check (status in ('PLACED','CONFIRMED','PICKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED')),
  payment_status        text not null default 'PENDING'
                        check (payment_status in ('PENDING','PAID','FAILED','REFUNDED')),
  subtotal              numeric(10,2) not null,
  delivery_fee          numeric(10,2) not null default 0,
  discount              numeric(10,2) not null default 0,
  total                 numeric(10,2) not null,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  estimated_delivery_at timestamptz,
  delivered_at          timestamptz,
  created_at            timestamptz not null default now()
);

-- ── ORDER ITEMS ───────────────────────────────────────────────
create table order_items (
  id         text primary key default gen_random_uuid()::text,
  order_id   text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  quantity   integer not null default 1,
  unit_price numeric(10,2) not null,
  total      numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- ── WISHLISTS ─────────────────────────────────────────────────
create table wishlists (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ── INDEXES ───────────────────────────────────────────────────
create index idx_products_category_slug on products(category_slug);
create index idx_products_is_active on products(is_active);
create index idx_products_is_featured on products(is_featured);
create index idx_products_slug on products(slug);
create index idx_categories_slug on categories(slug);
create index idx_wishlists_user on wishlists(user_id);
create index idx_orders_user on orders(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table categories  enable row level security;
alter table products    enable row level security;
alter table brands      enable row level security;
alter table dark_stores enable row level security;
alter table users       enable row level security;
alter table addresses   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table wishlists   enable row level security;

-- Public read for products & categories
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read products"   on products   for select using (is_active = true);
create policy "Public can read brands"     on brands     for select using (true);

-- Users own their data
create policy "Users read own data"     on users     for select using (auth.uid()::text = id);
create policy "Users update own data"   on users     for update using (auth.uid()::text = id);
create policy "Users insert own data"   on users     for insert with check (auth.uid()::text = id);

create policy "Users read own addresses"   on addresses for select using (auth.uid()::text = user_id);
create policy "Users manage own addresses" on addresses for all    using (auth.uid()::text = user_id);

create policy "Users read own orders"   on orders for select using (auth.uid()::text = user_id);
create policy "Users read own items"    on order_items for select
  using (exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid()::text));

create policy "Users manage own wishlist" on wishlists for all using (auth.uid()::text = user_id);

-- Service role bypass (for API routes using service key)
create policy "Service role full access products"   on products   for all using (auth.role() = 'service_role');
create policy "Service role full access categories" on categories for all using (auth.role() = 'service_role');
create policy "Service role full access orders"     on orders     for all using (auth.role() = 'service_role');
create policy "Service role full access users"      on users      for all using (auth.role() = 'service_role');
create policy "Service role full access wishlists"  on wishlists  for all using (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Dark store
insert into dark_stores (id, name, city, pincode, lat, lng, radius_km)
values ('store-chennai-01', 'Farmers Factory Warehouse Chennai', 'Chennai', '600001', 13.0827, 80.2707, 50);

-- Brands
insert into brands (id, name, slug, logo_url) values
  ('brand-ff',       'Farmers Factory',  'farmers-factory',  'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&h=200&fit=crop'),
  ('brand-valluvam', 'Valluvam Products', 'valluvam-products', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop');

-- Categories with real Unsplash images
insert into categories (id, name, slug, image_url, sort_order, meta_title, meta_description) values
  ('cat-veg',        'Farm Fresh Vegetables',      'farm-fresh',         'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop', 1,  'Farm Fresh Vegetables — Farmers Factory', 'Buy farm fresh vegetables online. 24-hour delivery.'),
  ('cat-fruit',      'Fresh Fruits',               'fruits',             'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop', 2,  'Fresh Fruits — Farmers Factory',          'Order fresh fruits online. Farm-to-door delivery.'),
  ('cat-rice',       'Traditional Rice',           'traditional-rice',   'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop', 3,  'Traditional Rice — Farmers Factory',      'Buy traditional rice varieties online.'),
  ('cat-oil',        'Cold-Pressed Oils',          'cold-pressed-oils',  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop', 4,  'Cold-Pressed Oils — Farmers Factory',     'Buy cold-pressed oils. 100% natural.'),
  ('cat-sugar',      'Country Sugar & Jaggery',    'sugar-jaggery',      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop', 5,  'Country Sugar & Jaggery — Farmers Factory','Buy country sugar and jaggery online.'),
  ('cat-grain',      'Organic Grains & Pulses',    'grains-pulses',      'https://images.unsplash.com/photo-1515942661900-94b3d1972591?w=200&h=200&fit=crop', 6,  'Organic Grains & Pulses — Farmers Factory','Buy organic grains and pulses online.'),
  ('cat-dairy',      'Dairy & Ghee',               'dairy-ghee',         'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop', 7,  'Dairy & Ghee — Farmers Factory',          'Buy fresh dairy and pure ghee online.'),
  ('cat-spice',      'Spices & Masala',            'spices',             'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop', 8,  'Spices & Masala — Farmers Factory',       'Buy fresh spices and masala online.'),
  ('cat-pickle',     'Pickles & Chutneys',         'pickles',            'https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=200&h=200&fit=crop', 9,  'Pickles & Chutneys — Farmers Factory',    'Buy traditional pickles and chutneys.'),
  ('cat-honey',      'Honey & Sweeteners',         'honey',              'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop', 10, 'Honey & Sweeteners — Farmers Factory',    'Buy pure honey and natural sweeteners.'),
  ('cat-organic',    'Certified Organic',          'organic',            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop', 11, 'Certified Organic — Farmers Factory',     'Buy certified organic products.'),
  ('cat-trad',       'Traditional Products',       'traditional',        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop', 12, 'Traditional Products — Farmers Factory',  'Buy authentic traditional Tamil Nadu products.');

-- Products (20 real Farmers Factory items)
insert into products (id, name, slug, description, image_urls, category_id, category_slug, brand_id, sku, mrp, price, unit, tags, is_featured, in_stock, average_rating, review_count) values

-- Farm Fresh Vegetables
('p01', 'Organic Broccoli', 'organic-broccoli-500g',
 'Farm-fresh broccoli grown without chemicals. Rich in vitamins C and K. Harvested daily from our partner farms in Ooty.',
 '["https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=400&fit=crop"]',
 'cat-veg', 'farm-fresh', 'brand-ff', 'FF-VEG-001', 65, 55, '500g',
 '["vegetables","organic","healthy"]', true, true, 4.6, 312),

('p02', 'Country Tomatoes', 'country-tomatoes-1kg',
 'Vine-ripened country tomatoes sourced directly from Karnataka farms. Perfect for gravies, soups, and salads.',
 '["https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=400&fit=crop"]',
 'cat-veg', 'farm-fresh', 'brand-ff', 'FF-VEG-002', 40, 32, '1kg',
 '["vegetables","fresh"]', false, true, 4.3, 189),

('p03', 'Baby Spinach', 'baby-spinach-250g',
 'Tender baby spinach leaves, freshly harvested. Zero pesticides. Perfect for salads, smoothies, and stir-fries.',
 '["https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop"]',
 'cat-veg', 'farm-fresh', 'brand-ff', 'FF-VEG-003', 45, 38, '250g',
 '["vegetables","leafy","organic"]', true, true, 4.7, 445),

('p04', 'Sweet Corn', 'sweet-corn-2-cobs',
 'Fresh sweet corn, plucked at peak sweetness. Great for boiling, grilling, and salads. Farm-harvested daily.',
 '["https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop"]',
 'cat-veg', 'farm-fresh', 'brand-ff', 'FF-VEG-004', 30, 25, '2 cobs',
 '["vegetables","fresh","sweet"]', false, true, 4.4, 267),

-- Fresh Fruits
('p05', 'Alphonso Mangoes', 'alphonso-mangoes-1kg',
 'The king of mangoes — Alphonso from Ratnagiri. Naturally ripened, juicy and sweet. Limited seasonal availability.',
 '["https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop"]',
 'cat-fruit', 'fruits', 'brand-ff', 'FF-FRUIT-001', 280, 240, '1kg (5-6 pcs)',
 '["fruits","mango","seasonal"]', true, true, 4.9, 876),

('p06', 'Red Apples', 'red-apples-1kg',
 'Crispy Himachali red apples, freshly sourced from orchards. High in fibre and natural antioxidants.',
 '["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop"]',
 'cat-fruit', 'fruits', 'brand-ff', 'FF-FRUIT-002', 180, 155, '1kg',
 '["fruits","apple","healthy"]', false, true, 4.5, 534),

('p07', 'Coconut (with water)', 'fresh-coconut-each',
 'Tender green coconut with refreshing natural water. Each coconut yields 200-300ml of natural electrolyte drink.',
 '["https://images.unsplash.com/photo-1581367736519-0a48c31da7c5?w=400&h=400&fit=crop"]',
 'cat-fruit', 'fruits', 'brand-ff', 'FF-FRUIT-003', 45, 38, 'Each',
 '["fruits","coconut","healthy"]', true, true, 4.6, 423),

-- Traditional Rice
('p08', 'Seeraga Samba Rice', 'seeraga-samba-rice-5kg',
 'Heritage Seeraga Samba rice from Tamil Nadu. Fragrant, slender grain — ideal for biryani and pulao. Pesticide-free cultivation.',
 '["https://images.unsplash.com/photo-1536304993881-ff86e0c9c5e9?w=400&h=400&fit=crop"]',
 'cat-rice', 'traditional-rice', 'brand-valluvam', 'VL-RICE-001', 650, 590, '5kg',
 '["rice","traditional","biryani"]', true, true, 4.8, 721),

('p09', 'Ponni Boiled Rice', 'ponni-boiled-rice-5kg',
 'Classic Ponni Boiled Rice — the staple of Tamil Nadu homes. Double-boiled for better nutrition retention. Fluffy texture.',
 '["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop"]',
 'cat-rice', 'traditional-rice', 'brand-valluvam', 'VL-RICE-002', 340, 310, '5kg',
 '["rice","traditional","staple"]', false, true, 4.5, 398),

-- Cold-Pressed Oils
('p10', 'Cold-Pressed Gingelly Oil', 'cold-pressed-gingelly-oil-1l',
 'Pure cold-pressed sesame (gingelly) oil from traditional wooden churner (mara chekku). Retains all nutrients and authentic flavour.',
 '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop"]',
 'cat-oil', 'cold-pressed-oils', 'brand-valluvam', 'VL-OIL-001', 420, 380, '1 Litre',
 '["oil","cold-pressed","sesame"]', true, true, 4.9, 1243),

('p11', 'Cold-Pressed Coconut Oil', 'cold-pressed-coconut-oil-500ml',
 'Virgin cold-pressed coconut oil — chemical-free, first-press extraction. Perfect for cooking, hair, and skin care.',
 '["https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&h=400&fit=crop"]',
 'cat-oil', 'cold-pressed-oils', 'brand-valluvam', 'VL-OIL-002', 320, 285, '500ml',
 '["oil","cold-pressed","coconut"]', true, true, 4.8, 987),

-- Country Sugar & Jaggery
('p12', 'Country Jaggery (Vellam)', 'country-jaggery-1kg',
 'Traditional palm jaggery from Villupuram. Made using age-old methods, retaining natural minerals and molasses. Unprocessed, chemical-free.',
 '["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop"]',
 'cat-sugar', 'sugar-jaggery', 'brand-valluvam', 'VL-SUGAR-001', 180, 155, '1kg',
 '["jaggery","natural","unprocessed"]', true, true, 4.7, 634),

('p13', 'Palm Sugar (Panangkarkandu)', 'palm-sugar-500g',
 'Authentic panangkarkandu (palm candy) from Tirunelveli. Natural sweetener with a rich caramel flavour. Low glycaemic index.',
 '["https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=400&fit=crop"]',
 'cat-sugar', 'sugar-jaggery', 'brand-valluvam', 'VL-SUGAR-002', 220, 195, '500g',
 '["sugar","palm","natural"]', false, true, 4.6, 312),

-- Organic Grains & Pulses
('p14', 'Organic Red Lentils (Masoor Dal)', 'organic-masoor-dal-1kg',
 'Organically grown masoor dal from certified farms. High protein content. Cooks in under 20 minutes without soaking.',
 '["https://images.unsplash.com/photo-1515942661900-94b3d1972591?w=400&h=400&fit=crop"]',
 'cat-grain', 'grains-pulses', 'brand-ff', 'FF-GRAIN-001', 140, 120, '1kg',
 '["pulses","organic","protein"]', false, true, 4.4, 289),

('p15', 'Organic Finger Millet (Ragi)', 'organic-ragi-flour-1kg',
 'Stone-ground organic ragi (finger millet) flour. Rich in calcium, iron and dietary fibre. Perfect for dosas, rotis and porridge.',
 '["https://images.unsplash.com/photo-1589927986089-35812378533e?w=400&h=400&fit=crop"]',
 'cat-grain', 'grains-pulses', 'brand-ff', 'FF-GRAIN-002', 130, 110, '1kg',
 '["grain","ragi","organic","millets"]', true, true, 4.7, 521),

-- Dairy & Ghee
('p16', 'A2 Cow Ghee', 'a2-cow-ghee-500ml',
 'Pure A2 bilona ghee from Gir cows. Made using traditional churning method (bilona). Rich in butyric acid and CLA. Deep golden colour.',
 '["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop"]',
 'cat-dairy', 'dairy-ghee', 'brand-ff', 'FF-DAIRY-001', 980, 890, '500ml',
 '["ghee","a2","traditional"]', true, true, 4.9, 1567),

('p17', 'Fresh Curd (Thayir)', 'fresh-curd-500g',
 'Made from fresh full-cream milk, set overnight. Thick, creamy and tangy. No preservatives or stabilisers. From Aavin partnered dairies.',
 '["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop"]',
 'cat-dairy', 'dairy-ghee', 'brand-ff', 'FF-DAIRY-002', 55, 50, '500g',
 '["dairy","curd","fresh"]', false, true, 4.5, 438),

-- Spices & Masala
('p18', 'Chettinad Masala Powder', 'chettinad-masala-200g',
 'Authentic Chettinad masala hand-ground with 18 spices. No artificial colour or preservatives. The secret to authentic Chettinad cuisine.',
 '["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop"]',
 'cat-spice', 'spices', 'brand-valluvam', 'VL-SPICE-001', 180, 155, '200g',
 '["spice","masala","chettinad"]', true, true, 4.8, 892),

-- Honey
('p19', 'Raw Forest Honey', 'raw-forest-honey-500g',
 'Unprocessed raw honey collected from wild bee hives in the Nilgiris forest. Never heated, retains all natural enzymes and antioxidants.',
 '["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop"]',
 'cat-honey', 'honey', 'brand-ff', 'FF-HONEY-001', 420, 380, '500g',
 '["honey","raw","natural","forest"]', true, true, 4.9, 1123),

-- Pickles
('p20', 'Homestyle Mango Pickle (Avakaya)', 'homestyle-mango-pickle-400g',
 'Traditional Telugu-style raw mango pickle made with first-press gingelly oil and sun-dried spices. Grandma''s recipe, crafted in small batches.',
 '["https://images.unsplash.com/photo-1589135716831-73e74f9e89c5?w=400&h=400&fit=crop"]',
 'cat-pickle', 'pickles', 'brand-valluvam', 'VL-PICKLE-001', 220, 190, '400g',
 '["pickle","mango","traditional"]', true, true, 4.7, 645);

-- ============================================================
-- DONE! Now go to your .env.local and add:
-- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
-- ============================================================
