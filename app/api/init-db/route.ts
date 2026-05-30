import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// POST /api/init-db?secret=ff-init-2026-secret
// Creates all Prisma tables via $executeRawUnsafe then seeds data
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== (process.env['INIT_SECRET'] ?? 'ff-init-2026-secret')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── 1. Create all tables from DDL ─────────────────────────────
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-schema.sql');
    if (fs.existsSync(sqlPath)) {
      const ddl = fs.readFileSync(sqlPath, 'utf-8');
      // Split by statement and wrap each in IF NOT EXISTS where possible
      const statements = ddl
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await prisma.$executeRawUnsafe(stmt + ';');
        } catch {
          // Ignore "already exists" errors
        }
      }
      console.log('[init-db] Schema created');
    }

    // ── 2. Check if already seeded ────────────────────────────────
    const count = await prisma.category.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', categories: count });
    }

    // ── 3. Load seed data ─────────────────────────────────────────
    const exportPath = path.join(process.cwd(), 'scripts', 'seed-export.json');
    if (!fs.existsSync(exportPath)) {
      return NextResponse.json({ error: 'seed-export.json not found' }, { status: 500 });
    }

    const { categories, products, banners } = JSON.parse(
      fs.readFileSync(exportPath, 'utf-8')
    );

    // ── 4. Seed categories ────────────────────────────────────────
    const topLevel = categories.filter((c: any) => !c.parentId);
    const children = categories.filter((c: any) => c.parentId);

    for (const cat of topLevel) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id, name: cat.name, slug: cat.slug,
          description: cat.description, imageUrl: cat.imageUrl,
          iconUrl: cat.iconUrl, sortOrder: cat.sortOrder,
          isActive: cat.isActive, metaTitle: cat.metaTitle,
          metaDescription: cat.metaDescription, ogImageUrl: cat.ogImageUrl,
        },
      });
    }
    for (const cat of children) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          id: cat.id, name: cat.name, slug: cat.slug,
          description: cat.description, imageUrl: cat.imageUrl,
          iconUrl: cat.iconUrl, parentId: cat.parentId,
          sortOrder: cat.sortOrder, isActive: cat.isActive,
          metaTitle: cat.metaTitle, metaDescription: cat.metaDescription,
          ogImageUrl: cat.ogImageUrl,
        },
      });
    }

    // ── 5. Seed products ──────────────────────────────────────────
    const BATCH = 30;
    for (let i = 0; i < products.length; i += BATCH) {
      await Promise.all(
        products.slice(i, i + BATCH).map((p: any) =>
          prisma.product.upsert({
            where: { id: p.id },
            update: {},
            create: {
              id: p.id, name: p.name, slug: p.slug,
              description: p.description, imageUrls: p.imageUrls,
              blurDataUrls: p.blurDataUrls ?? '[]',
              categoryId: p.categoryId, brandId: p.brandId,
              sku: p.sku, barcode: p.barcode,
              mrp: p.mrp, price: p.price, unit: p.unit,
              tags: p.tags ?? '[]', attributes: p.attributes,
              isFeatured: p.isFeatured, isActive: p.isActive,
              inStock: p.inStock, metaTitle: p.metaTitle,
              metaDescription: p.metaDescription,
              averageRating: p.averageRating, reviewCount: p.reviewCount,
              sortOrder: p.sortOrder,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
            },
          })
        )
      );
    }

    // ── 6. Seed banners ───────────────────────────────────────────
    for (const b of banners) {
      await prisma.banner.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id, title: b.title, imageUrl: b.imageUrl,
          altText: b.altText, linkUrl: b.linkUrl,
          position: b.position, sortOrder: b.sortOrder,
          isActive: b.isActive,
          validFrom: b.validFrom ? new Date(b.validFrom) : null,
          validUntil: b.validUntil ? new Date(b.validUntil) : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      seeded: { categories: categories.length, products: products.length, banners: banners.length },
    });
  } catch (err: any) {
    console.error('[init-db]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
