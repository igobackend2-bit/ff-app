/**
 * GET /api/admin/import-live-data
 * One-time migration: pulls all categories + products from the old live site
 * (ff-app-pi.vercel.app, backed by the qwium Supabase project) into this
 * deployment's Postgres via Prisma, cleaning up broken product names on the way.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const maxDuration = 60;

const SOURCE = 'https://ff-app-pi.vercel.app';

// Curated fixes for known-bad names, keyed by source slug
const NAME_FIXES: Record<string, string> = {
  'sesame500':                 'Cold-Pressed Sesame Oil (500 ml)',
  'sesame-1-l':                'Cold-Pressed Sesame Oil (1 L)',
  'coconutoil250':             'Cold-Pressed Coconut Oil (250 ml)',
  'coconut-1-l':               'Cold-Pressed Coconut Oil (1 L)',
  'groundnutoil250':           'Cold-Pressed Groundnut Oil (250 ml)',
  'ground-1-l':                'Cold-Pressed Groundnut Oil (1 L)',
  'staranise':                 'Star Anise',
  'sweetcorn':                 'Sweet Corn',
  'onionbig':                  'Onion (Big)',
  'onionred':                  'Red Onion',
  'redbanana':                 'Red Banana',
  'drygrapesgreen':            'Dry Grapes (Green)',
  'sunflowerseeds':            'Sunflower Seeds',
  'sweetpotato':               'Sweet Potato',
  'honeyamla':                 'Honey Amla',
  'ghee250':                   'Pure Cow Ghee (250 ml)',
  'sorghum-cholam-w-h-i-t-e':  'Sorghum Cholam (White)',
  'palm-jaggery-500':          'Palm Jaggery (500 g)',
};

/** Generic cleanup for names like "Sesame500", "Pumpkin Yellow", "W H I T E" */
function cleanName(name: string, slug: string): string {
  const fixed = NAME_FIXES[slug];
  if (fixed) return fixed;

  let n = name.trim();
  // Collapse runs of single letters: "W H I T E" -> "White"
  n = n.replace(/\b(?:[A-Za-z] ){2,}[A-Za-z]\b/g, (m) => {
    const word = m.replace(/ /g, '');
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  // Insert a space between letters and trailing digits: "Sesame500" -> "Sesame 500"
  n = n.replace(/([a-zA-Z])(\d)/g, '$1 $2');
  return n;
}

interface SrcCategory {
  id: string; name: string; slug: string; description: string | null;
  imageUrl: string | null; iconUrl: string | null; sortOrder: number;
  _count?: { products: number };
}

interface SrcProduct {
  id: string; name: string; slug: string; description: string | null;
  imageUrls: string[]; categorySlug: string; sku: string | null;
  mrp: number | null; price: number; unit: string; tags: string[];
  isFeatured: boolean; inStock: boolean;
  averageRating: number; reviewCount: number;
}

export async function GET() {
  try {
    const report: Record<string, unknown> = {};

    // ── 1. Fetch categories from live site ─────────────────────────────────
    const catRes = await fetch(`${SOURCE}/api/categories`, { cache: 'no-store' });
    if (!catRes.ok) throw new Error(`Source categories HTTP ${catRes.status}`);
    const catJson = (await catRes.json()) as { data: SrcCategory[] };
    const srcCats = catJson.data ?? [];

    const catIdMap = new Map<string, string>(); // slug -> new id
    for (const c of srcCats) {
      const cat = await prisma.category.upsert({
        where:  { slug: c.slug },
        update: { name: c.name, imageUrl: c.imageUrl ?? '', sortOrder: c.sortOrder, isActive: true },
        create: {
          name: c.name, slug: c.slug, sortOrder: c.sortOrder,
          description: c.description, imageUrl: c.imageUrl ?? '',
          iconUrl: c.iconUrl, isActive: true,
        },
      });
      catIdMap.set(c.slug, cat.id);
    }
    report['categories_imported'] = srcCats.length;

    // ── 2. Fetch all products (paginated) ──────────────────────────────────
    const all: SrcProduct[] = [];
    let page = 1;
    for (;;) {
      const res = await fetch(`${SOURCE}/api/products?limit=50&page=${page}`, { cache: 'no-store' });
      if (!res.ok) break;
      const json = (await res.json()) as { data: { data: SrcProduct[]; hasMore: boolean } };
      const batch = json.data?.data ?? [];
      all.push(...batch);
      if (!json.data?.hasMore || batch.length === 0 || page > 10) break;
      page++;
    }
    report['products_fetched'] = all.length;

    // ── 3. Upsert products with cleaned names ──────────────────────────────
    let created = 0, updated = 0, skipped = 0, renamed = 0;
    for (const p of all) {
      const categoryId = catIdMap.get(p.categorySlug);
      if (!categoryId) { skipped++; continue; }

      const name = cleanName(p.name, p.slug);
      if (name !== p.name) renamed++;

      const sku = (p.sku && p.sku.trim())
        ? p.sku
        : `FF-${p.slug}`.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 48);

      const data = {
        name,
        description:  p.description,
        imageUrls:    JSON.stringify(p.imageUrls ?? []),
        categoryId,
        mrp:          p.mrp ?? p.price,
        price:        p.price,
        unit:         p.unit || 'unit',
        tags:         JSON.stringify(p.tags ?? []),
        isFeatured:   p.isFeatured,
        isActive:     true,
        inStock:      p.inStock,
        averageRating: p.averageRating ?? 0,
        reviewCount:   p.reviewCount ?? 0,
      };

      const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        try {
          await prisma.product.create({ data: { ...data, slug: p.slug, sku } });
          created++;
        } catch {
          // SKU collision — retry with slug-derived SKU
          await prisma.product.create({
            data: { ...data, slug: p.slug, sku: `FF-${p.slug}`.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 48) },
          });
          created++;
        }
      }
    }

    report['products_created'] = created;
    report['products_updated'] = updated;
    report['products_renamed'] = renamed;
    report['products_skipped'] = skipped;

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error('[import-live-data]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
