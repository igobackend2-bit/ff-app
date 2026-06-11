import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ProductRow {
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  unit: string;
  category: string;   // slug
  tags?: string;
  imageUrl?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

function makeSlug(name: string, unit: string) {
  return (name + '-' + unit)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeSku(name: string) {
  return 'BLK-' + name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-' + Date.now().toString().slice(-5);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { products: ProductRow[] };
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }
    if (products.length > 500) {
      return NextResponse.json({ error: 'Max 500 products per upload' }, { status: 400 });
    }

    // Fetch all categories once
    const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true } });
    const catBySlug  = new Map(categories.map((c) => [c.slug.toLowerCase(), c]));
    const catByName  = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    const results: { name: string; status: 'created' | 'skipped' | 'error'; reason?: string }[] = [];

    for (const row of products) {
      try {
        if (!row.name?.trim()) { results.push({ name: String(row.name ?? ''), status: 'error', reason: 'Name required' }); continue; }
        if (!row.price || isNaN(Number(row.price))) { results.push({ name: row.name, status: 'error', reason: 'Invalid price' }); continue; }
        if (!row.unit?.trim()) { results.push({ name: row.name, status: 'error', reason: 'Unit required' }); continue; }

        // Resolve category
        const catKey  = String(row.category ?? '').toLowerCase().trim();
        const cat     = catBySlug.get(catKey) ?? catByName.get(catKey);
        if (!cat) { results.push({ name: row.name, status: 'error', reason: `Category not found: ${row.category}` }); continue; }

        // Build unique slug + SKU
        let baseSlug = makeSlug(row.name, row.unit);
        let slug     = baseSlug;
        let attempt  = 0;
        // Ensure uniqueness
        while (await prisma.product.findUnique({ where: { slug } })) {
          attempt++;
          slug = baseSlug + '-' + attempt;
        }

        const imageUrls = row.imageUrl?.trim() ? JSON.stringify([row.imageUrl.trim()]) : JSON.stringify([]);
        const tags      = row.tags?.trim() ? JSON.stringify(row.tags.split(',').map((t) => t.trim()).filter(Boolean)) : JSON.stringify([]);

        await prisma.product.create({
          data: {
            name:          row.name.trim(),
            slug,
            description:   row.description?.trim() ?? null,
            imageUrls,
            blurDataUrls:  JSON.stringify([]),
            categoryId:    cat.id,
            sku:           makeSku(row.name),
            mrp:           Number(row.mrp ?? row.price),
            price:         Number(row.price),
            unit:          row.unit.trim(),
            tags,
            isFeatured:    Boolean(row.isFeatured),
            isActive:      true,
            inStock:       row.inStock !== false,
            averageRating: Number(row.averageRating ?? 0),
            reviewCount:   Number(row.reviewCount ?? 0),
          },
        });
        results.push({ name: row.name, status: 'created' });
      } catch (rowErr) {
        results.push({ name: String(row.name ?? ''), status: 'error', reason: String(rowErr) });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const errors  = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({ ok: true, created, errors, total: products.length, results });
  } catch (err) {
    console.error('[bulk-upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
