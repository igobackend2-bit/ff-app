/**
 * GET /api/admin/fix-product-categories
 * Fixes category assignments + product images for:
 *   - cold-pressed-oils (re-assigns from oils-ghee, fixes images)
 *   - honey (creates products if missing)
 *   - dairy-ghee (creates products if missing)
 *   - valluvam (creates brand products if missing)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const O = '/images/oils';
const V = '/images/valluvam';

// Cold-Pressed Oil products to ensure exist
const OIL_PRODUCTS = [
  { name: 'Cold-Pressed Coconut Oil',  unit: '500 ml', price: 285, mrp: 320, img: `${O}/coconutoil250.jpg`,  slug: 'cold-pressed-coconut-oil-500ml' },
  { name: 'Cold-Pressed Coconut Oil',  unit: '1 L',    price: 540, mrp: 600, img: `${O}/coconut-1L.jpg`,     slug: 'cold-pressed-coconut-oil-1l' },
  { name: 'Cold-Pressed Gingelly Oil', unit: '500 ml', price: 260, mrp: 286, img: `${O}/sesame500.jpg`,       slug: 'cold-pressed-gingelly-oil-500ml' },
  { name: 'Cold-Pressed Gingelly Oil', unit: '1 L',    price: 420, mrp: 462, img: `${O}/sesame-1L.jpg`,       slug: 'cold-pressed-gingelly-oil-1l' },
  { name: 'Cold-Pressed Groundnut Oil',unit: '500 ml', price: 190, mrp: 209, img: `${O}/groundnutoil250.jpg`, slug: 'cold-pressed-groundnut-oil-500ml' },
  { name: 'Cold-Pressed Groundnut Oil',unit: '1 L',    price: 350, mrp: 385, img: `${O}/ground-1L.jpg`,       slug: 'cold-pressed-groundnut-oil-1l' },
];

const HONEY_PRODUCTS = [
  { name: 'Pure Forest Honey', unit: '250 ml', price: 185, mrp: 220, img: `${V}/honey.jpeg`,  slug: 'pure-forest-honey-250ml' },
  { name: 'Pure Forest Honey', unit: '500 ml', price: 350, mrp: 420, img: `${V}/honey.jpeg`,  slug: 'pure-forest-honey-500ml' },
];

const GHEE_PRODUCTS = [
  { name: 'Pure Cow Ghee',  unit: '250 ml', price: 280, mrp: 320, img: `${V}/Ghee250.jpg`,      slug: 'pure-cow-ghee-250ml' },
  { name: 'Buffalo Ghee',   unit: '250 ml', price: 220, mrp: 250, img: `${V}/buffalo(250).jpg`,  slug: 'buffalo-ghee-250ml' },
  { name: 'Buffalo Ghee',   unit: '500 ml', price: 420, mrp: 480, img: `${V}/buffalo(500).jpg`,  slug: 'buffalo-ghee-500ml' },
];

const VALLUVAM_PRODUCTS = [
  { name: 'Valluvam Palm Jaggery',       unit: '500 gm',  price: 120, mrp: 140, img: `${V}/palm-jaggery(500).jpeg`, slug: 'valluvam-palm-jaggery-500gm' },
  { name: 'Valluvam Palm Jaggery Block', unit: '1 Kg',    price: 220, mrp: 250, img: `${V}/palm-jaggery.jpeg`,      slug: 'valluvam-palm-jaggery-block-1kg' },
  { name: 'Valluvam Pure Honey',         unit: '500 ml',  price: 350, mrp: 420, img: `${V}/honey.jpeg`,             slug: 'valluvam-pure-honey-500ml' },
  { name: 'Valluvam Pure Cow Ghee',      unit: '250 ml',  price: 280, mrp: 320, img: `${V}/Ghee250.jpg`,            slug: 'valluvam-pure-cow-ghee-250ml' },
  { name: 'Valluvam Buffalo Ghee',       unit: '500 ml',  price: 420, mrp: 480, img: `${V}/buffalo(500).jpg`,       slug: 'valluvam-buffalo-ghee-500ml' },
  { name: 'Valluvam Coconut Oil',        unit: '500 ml',  price: 285, mrp: 320, img: `${V}/coconutoil250.jpg`,      slug: 'valluvam-coconut-oil-500ml' },
  { name: 'Valluvam Groundnut Oil',      unit: '500 ml',  price: 190, mrp: 209, img: `${V}/groundnutoil250.jpg`,    slug: 'valluvam-groundnut-oil-500ml' },
  { name: 'Valluvam Sesame Oil',         unit: '500 ml',  price: 260, mrp: 286, img: `${V}/sesame500.jpg`,          slug: 'valluvam-sesame-oil-500ml' },
];

async function upsertProducts(
  categoryId: string,
  prefix: string,
  products: { name: string; unit: string; price: number; mrp: number; img: string; slug: string }[],
) {
  let created = 0, updated = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { slug: p.slug } });
    const sku = (prefix + '-' + p.slug).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 50);
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name, price: p.price, mrp: p.mrp, unit: p.unit,
          imageUrls:  JSON.stringify([p.img]),
          categoryId, isActive: true, inStock: true,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          name: p.name, slug: p.slug, price: p.price, mrp: p.mrp, unit: p.unit,
          imageUrls: JSON.stringify([p.img]),
          categoryId, sku,
          isActive: true, inStock: true, isFeatured: false,
        },
      });
      created++;
    }
  }
  return { created, updated };
}

export async function GET() {
  try {
    const report: Record<string, unknown> = {};

    // ── 1. Ensure categories exist ──────────────────────────────────────────
    const catDefs = [
      { slug: 'cold-pressed-oils', name: 'Cold-Pressed Oils',  sortOrder: 6, desc: 'Traditional wooden churner extracted oils' },
      { slug: 'honey',             name: 'Honey',               sortOrder: 9, desc: 'Raw natural honey — forest, rock and more' },
      { slug: 'dairy-ghee',        name: 'Dairy & Ghee',        sortOrder: 8, desc: 'Pure cow and buffalo ghee' },
      { slug: 'valluvam',          name: 'Valluvam Products',   sortOrder: 12, desc: 'Traditional products by Valluvam brand' },
    ];

    for (const c of catDefs) {
      await prisma.category.upsert({
        where:  { slug: c.slug },
        update: { name: c.name, isActive: true },
        create: {
          name: c.name, slug: c.slug, sortOrder: c.sortOrder,
          description: c.desc, isActive: true,
          imageUrl: null,
          metaTitle: `${c.name} — Farmers Factory`,
          metaDescription: `Buy ${c.name.toLowerCase()} online. 24-hour delivery.`,
        },
      });
    }
    report['categories_ensured'] = catDefs.map(c => c.slug);

    // ── 2. Get category IDs ─────────────────────────────────────────────────
    const [oilCat, honeyCat, gheeCat, valCat] = await Promise.all([
      prisma.category.findUnique({ where: { slug: 'cold-pressed-oils' } }),
      prisma.category.findUnique({ where: { slug: 'honey' } }),
      prisma.category.findUnique({ where: { slug: 'dairy-ghee' } }),
      prisma.category.findUnique({ where: { slug: 'valluvam' } }),
    ]);

    // ── 3. Re-assign any existing oil products to cold-pressed-oils ─────────
    if (oilCat) {
      // Find products with oil-related names that are NOT already in cold-pressed-oils
      const oilProducts = await prisma.product.findMany({
        where: {
          AND: [
            { categoryId: { not: oilCat.id } },
            {
              OR: [
                { name: { contains: 'oil' } },
                { name: { contains: 'Oil' } },
                { name: { contains: 'OIL' } },
              ],
            },
          ],
        },
      });

      let reassigned = 0;
      for (const p of oilProducts) {
        await prisma.product.update({
          where: { id: p.id },
          data: { categoryId: oilCat.id },
        });
        reassigned++;
      }
      report['oils_reassigned'] = reassigned;

      // Fix wrong images for oil products (replace any non-local image)
      const allOilProds = await prisma.product.findMany({ where: { categoryId: oilCat.id } });
      let imagesFixed = 0;
      for (const p of allOilProds) {
        let urls: string[] = [];
        try { urls = JSON.parse(p.imageUrls as string) as string[]; } catch { urls = []; }
        const hasLocal = urls.some(u => u.startsWith('/images/'));
        if (!hasLocal) {
          // Assign correct local image based on product name
          const n = p.name.toLowerCase();
          let img = `${O}/coconut-1L.jpg`; // default
          if (n.includes('coconut') && (n.includes('250') || n.includes('500 ml') || n.includes('500ml'))) img = `${O}/coconutoil250.jpg`;
          else if (n.includes('coconut')) img = `${O}/coconut-1L.jpg`;
          else if (n.includes('groundnut') || n.includes('peanut') || n.includes('gingelly') || n.includes('sesame')) {
            if (n.includes('250') || n.includes('500 ml') || n.includes('500ml')) img = n.includes('sesame') || n.includes('gingelly') ? `${O}/sesame500.jpg` : `${O}/groundnutoil250.jpg`;
            else img = n.includes('sesame') || n.includes('gingelly') ? `${O}/sesame-1L.jpg` : `${O}/ground-1L.jpg`;
          }
          await prisma.product.update({
            where: { id: p.id },
            data:  { imageUrls: JSON.stringify([img]) },
          });
          imagesFixed++;
        }
      }
      report['oil_images_fixed'] = imagesFixed;

      // Upsert canonical cold-pressed oil products
      report['oils_upserted'] = await upsertProducts(oilCat.id, 'OIL', OIL_PRODUCTS);
    }

    // ── 4. Honey products ───────────────────────────────────────────────────
    if (honeyCat) {
      // Re-assign existing honey products
      const existingHoney = await prisma.product.findMany({
        where: {
          AND: [
            { categoryId: { not: honeyCat.id } },
            {
              OR: [
                { name: { contains: 'honey' } },
                { name: { contains: 'Honey' } },
                { name: { contains: 'HONEY' } },
              ],
            },
          ],
        },
      });
      for (const p of existingHoney) {
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: honeyCat.id } });
      }
      report['honey_reassigned'] = existingHoney.length;
      report['honey_upserted'] = await upsertProducts(honeyCat.id, 'HNY', HONEY_PRODUCTS);
    }

    // ── 5. Dairy & Ghee products ────────────────────────────────────────────
    if (gheeCat) {
      const existingGhee = await prisma.product.findMany({
        where: {
          AND: [
            { categoryId: { not: gheeCat.id } },
            {
              OR: [
                { name: { contains: 'ghee' } },
                { name: { contains: 'Ghee' } },
                { name: { contains: 'GHEE' } },
              ],
            },
          ],
        },
      });
      for (const p of existingGhee) {
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: gheeCat.id } });
      }
      report['ghee_reassigned'] = existingGhee.length;
      report['ghee_upserted'] = await upsertProducts(gheeCat.id, 'GHE', GHEE_PRODUCTS);
    }

    // ── 6. Valluvam products ────────────────────────────────────────────────
    if (valCat) {
      report['valluvam_upserted'] = await upsertProducts(valCat.id, 'VAL', VALLUVAM_PRODUCTS);
    }

    // ── 7. Fix dairy-ghee products wrong images ─────────────────────────────
    if (gheeCat) {
      const gheeProds = await prisma.product.findMany({ where: { categoryId: gheeCat.id } });
      let gheeImgFixed = 0;
      for (const p of gheeProds) {
        let urls: string[] = [];
        try { urls = JSON.parse(p.imageUrls as string) as string[]; } catch { urls = []; }
        const hasLocal = urls.some(u => u.startsWith('/images/'));
        if (!hasLocal) {
          const n = p.name.toLowerCase();
          const img = n.includes('buffalo') && n.includes('500')
            ? `${V}/buffalo(500).jpg`
            : n.includes('buffalo')
            ? `${V}/buffalo(250).jpg`
            : `${V}/Ghee250.jpg`;
          await prisma.product.update({ where: { id: p.id }, data: { imageUrls: JSON.stringify([img]) } });
          gheeImgFixed++;
        }
      }
      report['ghee_images_fixed'] = gheeImgFixed;
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error('[fix-product-categories]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
