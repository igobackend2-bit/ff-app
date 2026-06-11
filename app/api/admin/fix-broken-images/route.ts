import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const log: string[] = [];

    // ── 1. HONEY: fix cloudinary / empty → local honey image ─────────────
    const honeyProds = await prisma.product.findMany({ where: { category: { slug: 'honey' } } });
    for (const p of honeyProds) {
      const imgs: string[] = JSON.parse(p.imageUrls || '[]');
      if (!imgs[0] || imgs[0].startsWith('https://') || imgs[0].startsWith('data:')) {
        await prisma.product.update({ where: { id: p.id }, data: { imageUrls: JSON.stringify(['/images/valluvam/honey.jpeg']) } });
        log.push(`Honey fixed: ${p.name}`);
      }
    }

    // ── 2. DAIRY-GHEE: delete non-ghee, fix ghee images ──────────────────
    const dairyProds = await prisma.product.findMany({ where: { category: { slug: 'dairy-ghee' } } });
    const nonGheeKeywords = ['Egg', 'Curd', 'Milk', 'Thayir'];
    for (const p of dairyProds) {
      if (nonGheeKeywords.some(k => p.name.includes(k))) {
        await prisma.product.delete({ where: { id: p.id } });
        log.push(`Deleted from dairy-ghee: ${p.name}`);
        continue;
      }
      const imgs: string[] = JSON.parse(p.imageUrls || '[]');
      if (!imgs[0] || imgs[0].startsWith('https://') || imgs[0].startsWith('data:')) {
        let img = '/images/valluvam/Ghee250.jpg';
        if (p.name.toLowerCase().includes('buffalo') && p.unit.includes('250')) img = '/images/valluvam/buffalo(250).jpg';
        if (p.name.toLowerCase().includes('buffalo') && p.unit.includes('500')) img = '/images/valluvam/buffalo(500).jpg';
        await prisma.product.update({ where: { id: p.id }, data: { imageUrls: JSON.stringify([img]) } });
        log.push(`Ghee image fixed: ${p.name}`);
      }
    }

    // ── 3. Rename dairy-ghee category → "Ghee" ───────────────────────────
    const dairyCat = await prisma.category.findUnique({ where: { slug: 'dairy-ghee' } });
    if (dairyCat && dairyCat.name !== 'Ghee') {
      await prisma.category.update({ where: { slug: 'dairy-ghee' }, data: { name: 'Ghee' } });
      log.push('Renamed category dairy-ghee → Ghee');
    }

    // ── 4. SPICES: delete products with cloudinary / broken images ────────
    const badSpiceNames = ['Sambar Powder', 'Turmeric Powder', 'Cumin (Jeera) Organic', 'Fenugreek (Vendhayam)', 'Whole Black Pepper'];
    const spiceProds = await prisma.product.findMany({ where: { category: { slug: 'spices' } } });
    for (const p of spiceProds) {
      const imgs: string[] = JSON.parse(p.imageUrls || '[]');
      const isBadImg = !imgs[0] || imgs[0].startsWith('https://res.cloudinary') || imgs[0].startsWith('data:');
      if (isBadImg && badSpiceNames.some(n => p.name.startsWith(n.split(' ')[0]!) && p.name.includes(n))) {
        await prisma.product.delete({ where: { id: p.id } });
        log.push(`Deleted bad spice: ${p.name}`);
      }
    }

    // ── 5. OILS: delete non-valluvam products & beetroot ─────────────────
    const oilProds = await prisma.product.findMany({ where: { category: { slug: 'cold-pressed-oils' } } });
    for (const p of oilProds) {
      const lower = p.name.toLowerCase();
      if (
        lower.startsWith('castor') ||
        lower.startsWith('chekku') ||
        lower.startsWith('mustard oil') ||
        lower === 'beetroot' ||
        lower.includes('beetroot')
      ) {
        await prisma.product.delete({ where: { id: p.id } });
        log.push(`Deleted unwanted oil product: ${p.name}`);
      }
    }

    // ── 6. SEEDS: fix image paths from /valluvam → /nuts or /dryfruits ───
    const seedsMap: Record<string, string> = {
      'Chia Seed':       '/images/nuts/chiaseeds.jpg',
      'Flax Seed':       '/images/nuts/flaxseeds.jpg',
      'Pumpkin Seeds':   '/images/nuts/PumpkinSeeds.jpg',
      'Sunflower Seeds': '/images/nuts/sunflowerseeds.jpg',
      'Cucumber Seeds':  '/images/nuts/CucumberSeeds.jpg',
      'Dry Honey Amla':  '/images/dryfruits/honeyamla.jpg',
      'Padam Pisin':     '/images/dryfruits/PadamPisin.jpg',
    };
    const seedsProds = await prisma.product.findMany({ where: { category: { slug: 'seeds-health-mix' } } });
    for (const p of seedsProds) {
      const newImg = seedsMap[p.name];
      if (newImg) {
        await prisma.product.update({ where: { id: p.id }, data: { imageUrls: JSON.stringify([newImg]) } });
        log.push(`Seeds image fixed: ${p.name}`);
      }
    }

    // ── 7. VALLUVAM: ensure all products have valid local image paths ─────
    const valProds = await prisma.product.findMany({ where: { category: { slug: 'valluvam' } } });
    for (const p of valProds) {
      const imgs: string[] = JSON.parse(p.imageUrls || '[]');
      if (!imgs[0] || imgs[0].startsWith('https://') || imgs[0].startsWith('data:')) {
        log.push(`WARNING — valluvam product has no local image: ${p.name}`);
      }
    }

    return NextResponse.json({ ok: true, total: log.length, log });
  } catch (err) {
    console.error('[fix-broken-images]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
