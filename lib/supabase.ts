// ── Supabase REST API Client ──────────────────────────────────────────────────
// Uses Supabase's PostgREST HTTP API directly — no npm package required.
// All requests go to https://{project}.supabase.co/rest/v1/{table}

// ERP Supabase (active project) — used as a hard fallback because the
// production env vars are currently blank, which would otherwise break every query.
const ERP_URL = 'https://qwiumswrbddwmlraktvy.supabase.co';
const ERP_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

const ENV_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const ENV_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

const SUPABASE_URL = ENV_URL.startsWith('https://') ? ENV_URL : ERP_URL;
const SUPABASE_ANON_KEY = ENV_KEY.length > 10 ? ENV_KEY : ERP_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 10;

// ── Generic REST helper ───────────────────────────────────────────────────────
async function supabaseREST<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    select?: string;
    filters?: string;
    order?: string;
    limit?: number;
    offset?: number;
    body?: unknown;
    useServiceRole?: boolean;
    returning?: string;
  } = {},
): Promise<T[]> {
  const {
    method = 'GET',
    select = '*',
    filters = '',
    order = '',
    limit,
    offset,
    body,
    useServiceRole = false,
    returning,
  } = options;

  const key = useServiceRole ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);

  if (method === 'GET') {
    url.searchParams.set('select', select);
    if (filters) filters.split('&').forEach((f) => {
      const [k, v] = f.split('=');
      if (k && v) url.searchParams.set(k, v);
    });
    if (order) url.searchParams.set('order', order);
    if (limit !== undefined) url.searchParams.set('limit', String(limit));
    if (offset !== undefined) url.searchParams.set('offset', String(offset));
  }

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (returning) headers['Prefer'] = `return=${returning}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase ${method} ${table}: ${err}`);
  }

  if (method !== 'GET' && !returning) return [];
  return res.json() as Promise<T[]>;
}

// ── Count helper ──────────────────────────────────────────────────────────────
async function supabaseCount(table: string, filters = ''): Promise<number> {
  const key = SUPABASE_ANON_KEY;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', 'id');
  if (filters) filters.split('&').forEach((f) => {
    const [k, v] = f.split('=');
    if (k && v) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Range': '0-0/0',
      Prefer: 'count=exact',
    },
    cache: 'no-store',
  });

  const range = res.headers.get('content-range');
  if (range) {
    const total = range.split('/')[1];
    return total ? parseInt(total, 10) : 0;
  }
  return 0;
}

// ── Exported db object ────────────────────────────────────────────────────────
export const db = {
  // Products
  async getProducts(opts: {
    category?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
    sort?: string;
  }) {
    const filters: string[] = ['is_active=eq.true'];
    if (opts.category) filters.push(`category_slug=eq.${opts.category}`);
    if (opts.featured) filters.push('is_featured=eq.true');
    if (opts.search) {
      // PostgREST full-text search
      filters.push(`name=ilike.*${opts.search}*`);
    }

    const order =
      opts.sort === 'price_asc' ? 'price.asc' :
      opts.sort === 'price_desc' ? 'price.desc' :
      opts.sort === 'new' ? 'created_at.desc' : 'is_featured.desc';

    // NOTE: products table has flat `category` / `category_slug` columns —
    // there is no FK to a `categories` table, so embedding it throws PGRST200.
    const [rows, total] = await Promise.all([
      supabaseREST<Record<string, unknown>>('products', {
        select: '*',
        filters: filters.join('&'),
        order,
        limit: opts.limit ?? 20,
        offset: opts.offset ?? 0,
      }),
      supabaseCount('products', filters.join('&')),
    ]);

    return { rows, total };
  },

  async getProductBySlug(slug: string) {
    const rows = await supabaseREST<Record<string, unknown>>('products', {
      select: '*',
      filters: `slug=eq.${slug}&is_active=eq.true`,
      limit: 1,
    });
    return rows[0] ?? null;
  },

  // Categories — the `categories` table is empty, so derive the list from the
  // distinct category/category_slug values on the products table.
  async getCategories() {
    const rows = await supabaseREST<Record<string, unknown>>('products', {
      select: 'category,category_slug,category_id,image_url',
      filters: 'is_active=eq.true',
      order: 'category_slug.asc',
    });

    const bySlug = new Map<string, { name: string; id: string; image: string; count: number }>();
    for (const r of rows as any[]) {
      const slug = (r.category_slug ?? '').toString().trim();
      const name = (r.category ?? '').toString().trim();
      if (!slug || !name) continue;
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { name, id: r.category_id ?? slug, image: r.image_url ?? '', count: 1 });
      }
    }

    let sort = 0;
    return [...bySlug.entries()].map(([slug, v]) => ({
      id:          v.id,
      name:        v.name,
      slug,
      description: null,
      image_url:   v.image,
      icon_url:    null,
      parent_id:   null,
      sort_order:  sort++,
      meta_title:  null,
      meta_description: null,
      _count:      { products: v.count },
    }));
  },

  async getCategoryBySlug(slug: string) {
    // Derived from products (no populated categories table)
    const rows = await supabaseREST<Record<string, unknown>>('products', {
      select: 'category,category_slug,category_id,image_url',
      filters: `category_slug=eq.${slug}&is_active=eq.true`,
      limit: 1,
    });
    const r = rows[0] as any;
    if (!r) return null;
    return {
      id:          r.category_id ?? slug,
      name:        r.category ?? slug,
      slug,
      description: null,
      image_url:   r.image_url ?? '',
      icon_url:    null,
      parent_id:   null,
      sort_order:  0,
      meta_title:  null,
      meta_description: null,
    };
  },

  // Wishlist
  async getWishlist(userId: string) {
    return supabaseREST<Record<string, unknown>>('wishlists', {
      select: '*, products(id, name, slug, price, mrp, unit, image_urls, in_stock, average_rating, is_featured)',
      filters: `user_id=eq.${userId}`,
      order: 'created_at.desc',
    });
  },

  async addToWishlist(userId: string, productId: string) {
    return supabaseREST('wishlists', {
      method: 'POST',
      body: { user_id: userId, product_id: productId },
      returning: 'minimal',
    });
  },

  async removeFromWishlist(userId: string, productId: string) {
    return supabaseREST('wishlists', {
      method: 'DELETE',
      filters: `user_id=eq.${userId}&product_id=eq.${productId}`,
    });
  },

  // Admin stats
  async getAdminStats() {
    const [products, outOfStock, orders, pendingOrders, users] = await Promise.all([
      supabaseCount('products', 'is_active=eq.true'),
      supabaseCount('products', 'is_active=eq.true&in_stock=eq.false'),
      supabaseCount('orders'),
      supabaseCount('orders', 'status=eq.PENDING'),
      supabaseCount('users'),
    ]);
    return { products, outOfStock, orders, pendingOrders, users };
  },

  async getRecentOrders(limit = 8) {
    return supabaseREST<Record<string, unknown>>('orders', {
      select: '*, users(name, phone)',
      order: 'created_at.desc',
      limit,
    });
  },
};
