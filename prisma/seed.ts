import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const exportPath = path.join(process.cwd(), 'scripts', 'seed-export.json');
  if (!fs.existsSync(exportPath)) {
    console.log('No seed-export.json found, skipping seed.');
    return;
  }

  const { categories, products, banners } = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  // ── Categories ────────────────────────────────────────────
  console.log(`Seeding ${categories.length} categories...`);
  const topLevel = categories.filter((c: any) => !c.parentId);
  const children = categories.filter((c: any) => c.parentId);

  for (const cat of topLevel) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        iconUrl: cat.iconUrl,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        ogImageUrl: cat.ogImageUrl,
      },
    });
  }

  for (const cat of children) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        iconUrl: cat.iconUrl,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        ogImageUrl: cat.ogImageUrl,
      },
    });
  }

  // ── Products ──────────────────────────────────────────────
  console.log(`Seeding ${products.length} products...`);
  const BATCH = 50;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    await Promise.all(
      batch.map((p: any) =>
        prisma.product.upsert({
          where: { id: p.id },
          update: {},
          create: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            imageUrls: p.imageUrls,
            blurDataUrls: p.blurDataUrls ?? '[]',
            categoryId: p.categoryId,
            brandId: p.brandId,
            sku: p.sku,
            barcode: p.barcode,
            mrp: p.mrp,
            price: p.price,
            unit: p.unit,
            tags: p.tags ?? '[]',
            attributes: p.attributes,
            isFeatured: p.isFeatured,
            isActive: p.isActive,
            inStock: p.inStock,
            metaTitle: p.metaTitle,
            metaDescription: p.metaDescription,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount,
            sortOrder: p.sortOrder,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          },
        })
      )
    );
    console.log(`  Products: ${Math.min(i + BATCH, products.length)}/${products.length}`);
  }

  // ── Banners ───────────────────────────────────────────────
  console.log(`Seeding ${banners.length} banners...`);
  for (const b of banners) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl,
        altText: b.altText,
        linkUrl: b.linkUrl,
        position: b.position,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
        validFrom: b.validFrom ? new Date(b.validFrom) : null,
        validUntil: b.validUntil ? new Date(b.validUntil) : null,
      },
    });
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
