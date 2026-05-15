import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function slug(name: string, unit: string) {
  return (name + '-' + unit).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const V = '/images/valluvam';

type ProdEntry = { name: string; unit: string; price: number; mrp: number; img: string; slugSuffix?: string };

// ── GHEE products for dairy-ghee category ────────────────────────────────
const GHEE_PRODUCTS: ProdEntry[] = [
  { name: 'Buffalo Ghee',    unit: '250 gm', price: 370, mrp: 440, img: `${V}/buffalo(250).jpg` },
  { name: 'Buffalo Ghee',    unit: '500 gm', price: 740, mrp: 870, img: `${V}/buffalo(500).jpg` },
  { name: 'Pure Cow Ghee',   unit: '500 gm', price: 570, mrp: 670, img: `${V}/Ghee250.jpg` },
];

// ── HONEY products for honey category ────────────────────────────────────
const HONEY_PRODUCTS: ProdEntry[] = [
  { name: 'Valluvam Honey', unit: '250 ml', price: 140, mrp: 190, img: `${V}/honey.jpeg` },
  { name: 'Valluvam Honey', unit: '500 ml', price: 280, mrp: 350, img: `${V}/honey.jpeg` },
];

// ── VALLUVAM products — ALL brand products (honey, ghee, jaggery, oils) ───
// slugSuffix ensures no conflict with cold-pressed-oils copies
const VALLUVAM_PRODUCTS = [
  { name: 'Valluvam Honey',                       unit: '250 ml',   price: 140, mrp: 190, img: `${V}/honey.jpeg`,              slugSuffix: '' },
  { name: 'Valluvam Honey',                       unit: '500 ml',   price: 280, mrp: 350, img: `${V}/honey.jpeg`,              slugSuffix: '' },
  { name: 'Palm Jaggery (Karupatti)',              unit: '250 gm',   price: 99,  mrp: 110, img: `${V}/palm-jaggery.jpeg`,       slugSuffix: '' },
  { name: 'Palm Jaggery (Karupatti)',              unit: '500 gm',   price: 199, mrp: 220, img: `${V}/palm-jaggery(500).jpeg`,  slugSuffix: '' },
  { name: 'Buffalo Ghee',                         unit: '250 gm',   price: 370, mrp: 440, img: `${V}/buffalo(250).jpg`,         slugSuffix: '' },
  { name: 'Buffalo Ghee',                         unit: '500 gm',   price: 740, mrp: 870, img: `${V}/buffalo(500).jpg`,         slugSuffix: '' },
  { name: 'Pure Cow Ghee',                        unit: '500 gm',   price: 570, mrp: 670, img: `${V}/Ghee250.jpg`,              slugSuffix: '' },
  { name: 'Nattu Sakkarai (Country Sugar)',        unit: '200 gm',   price: 25,  mrp: 35,  img: `${V}/palm-jaggery.jpeg`,       slugSuffix: '' },
  { name: 'Palm Candy (Panangkarkandu)',           unit: '200 gm',   price: 60,  mrp: 100, img: `${V}/palm-jaggery.jpeg`,       slugSuffix: '' },
  // Valluvam-brand oils — listed here with -v suffix slug so they also appear in valluvam
  { name: 'Valluvam Coconut Oil (Marachekku)',     unit: '500 ml',   price: 349, mrp: 384, img: `${V}/coconutoil250.jpg`,        slugSuffix: '-v' },
  { name: 'Valluvam Coconut Oil (Marachekku)',     unit: '1000 ml',  price: 669, mrp: 736, img: `${V}/coconut-1L.jpg`,           slugSuffix: '-v' },
  { name: 'Valluvam Groundnut Oil (Marachekku)',   unit: '500 ml',   price: 190, mrp: 209, img: `${V}/groundnutoil250.jpg`,      slugSuffix: '-v' },
  { name: 'Valluvam Groundnut Oil (Marachekku)',   unit: '1 L',      price: 350, mrp: 385, img: `${V}/ground-1L.jpg`,            slugSuffix: '-v' },
  { name: 'Valluvam Sesame Oil (Marachekku)',      unit: '500 ml',   price: 260, mrp: 286, img: `${V}/sesame500.jpg`,             slugSuffix: '-v' },
  { name: 'Valluvam Sesame Oil (Marachekku)',      unit: '1 L',      price: 420, mrp: 462, img: `${V}/sesame-1L.jpg`,             slugSuffix: '-v' },
];

export async function GET() {
  const report: Record<string, unknown> = {};

  // ────────────────────────────────────────────────────────────────────────
  // 1. CLEAR broken images for 5 spice products
  // ────────────────────────────────────────────────────────────────────────
  const BROKEN_SPICES = [
    'Sambar Powder',
    'Turmeric Powder',
    'Fenugreek',
    'Cumin (Jeera) Organic',
    'Whole Black Pepper',
  ];

  let spiceCleared = 0;
  for (const namePart of BROKEN_SPICES) {
    const products = await prisma.product.findMany({
      where: { name: { contains: namePart } },
    });
    for (const p of products) {
      const urls: string[] = (() => {
        try { return JSON.parse(p.imageUrls as string) as string[]; } catch { return []; }
      })();
      // Only clear if no valid local path image
      const hasValidImage = urls.some(u => u.startsWith('/images/spices/') || u.startsWith('/images/valluvam/'));
      if (!hasValidImage) {
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrls: JSON.stringify([]) },
        });
        spiceCleared++;
      }
    }
  }
  report['spice_images_cleared'] = spiceCleared;

  // ────────────────────────────────────────────────────────────────────────
  // 2. CLEAR wrong images for 5 oil products + deactivate beetroot
  // ────────────────────────────────────────────────────────────────────────
  const BAD_OIL_NAMES = ['beetroot', 'Castor Oil', 'Chekku Coconut Oil', 'Chekku Sesame Oil', 'Chekku Groundnut Oil'];
  let oilCleared = 0;
  for (const namePart of BAD_OIL_NAMES) {
    const products = await prisma.product.findMany({
      where: { name: { contains: namePart, mode: 'insensitive' } },
    });
    for (const p of products) {
      const isBeetroot = p.name.toLowerCase().includes('beetroot');
      await prisma.product.update({
        where: { id: p.id },
        data: {
          imageUrls: JSON.stringify([]),
          ...(isBeetroot ? { isActive: false } : {}),
        },
      });
      oilCleared++;
    }
  }
  report['oil_images_cleared'] = oilCleared;

  // ────────────────────────────────────────────────────────────────────────
  // 3. SEED ghee products → dairy-ghee category
  // ────────────────────────────────────────────────────────────────────────
  const gheeCat = await prisma.category.findUnique({ where: { slug: 'dairy-ghee' } });
  let gheeCreated = 0, gheeUpdated = 0;
  if (gheeCat) {
    for (const p of GHEE_PRODUCTS) {
      const s = slug(p.name, p.unit);
      const existing = await prisma.product.findFirst({ where: { slug: s } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: gheeCat.id, isActive: true, inStock: true,
          },
        });
        gheeUpdated++;
      } else {
        const sku = ('GHE' + s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);
        await prisma.product.create({
          data: {
            name: p.name, slug: s, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: gheeCat.id, sku,
            isActive: true, inStock: true, isFeatured: false,
          },
        });
        gheeCreated++;
      }
    }
    report['ghee'] = { created: gheeCreated, updated: gheeUpdated };
  } else {
    report['ghee'] = 'dairy-ghee category not found — run /api/admin/setup-categories first';
  }

  // ────────────────────────────────────────────────────────────────────────
  // 4. SEED honey products → honey category
  // ────────────────────────────────────────────────────────────────────────
  const honeyCat = await prisma.category.findUnique({ where: { slug: 'honey' } });
  let honeyCreated = 0, honeyUpdated = 0;
  if (honeyCat) {
    for (const p of HONEY_PRODUCTS) {
      const s = slug(p.name, p.unit) + '-honey';
      const existing = await prisma.product.findFirst({ where: { slug: s } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: honeyCat.id, isActive: true, inStock: true,
          },
        });
        honeyUpdated++;
      } else {
        const sku = ('HON' + s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);
        await prisma.product.create({
          data: {
            name: p.name, slug: s, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: honeyCat.id, sku,
            isActive: true, inStock: true, isFeatured: false,
          },
        });
        honeyCreated++;
      }
    }
    report['honey'] = { created: honeyCreated, updated: honeyUpdated };
  } else {
    report['honey'] = 'honey category not found — run /api/admin/setup-categories first';
  }

  // ────────────────────────────────────────────────────────────────────────
  // 5. FIX valluvam category products — ensure all have correct images
  // ────────────────────────────────────────────────────────────────────────
  const valluvamCat = await prisma.category.findUnique({ where: { slug: 'valluvam' } });
  let valUpdated = 0, valCreated = 0;
  if (valluvamCat) {
    for (const p of VALLUVAM_PRODUCTS) {
      const s = slug(p.name, p.unit) + (p.slugSuffix ?? '');
      const existing = await prisma.product.findFirst({ where: { slug: s } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: valluvamCat.id, isActive: true, inStock: true,
          },
        });
        valUpdated++;
      } else {
        const sku = ('VAL' + s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);
        await prisma.product.create({
          data: {
            name: p.name, slug: s, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: valluvamCat.id, sku,
            isActive: true, inStock: true, isFeatured: false,
          },
        });
        valCreated++;
      }
    }
    report['valluvam'] = { created: valCreated, updated: valUpdated };
  } else {
    report['valluvam'] = 'valluvam category not found';
  }

  return NextResponse.json({ ok: true, report });
}
