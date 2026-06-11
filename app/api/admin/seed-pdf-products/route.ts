import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function makeSlug(name: string, unit: string) {
  return (name + '-' + unit).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/, '');
}

const V = '/images/valluvam';
const D = '/images/dryfruits';
const N = '/images/nuts';
const S = '/images/spices';
const O = '/images/oils';
const M = '/images/millets';

// ── VALLUVAM (honey, ghee, jaggery, sugar) ─────────────────────────────────
const VALLUVAM = [
  { name: 'Valluvam Honey',              unit: '250 gm', price: 140, mrp: 190, img: `${V}/honey.jpeg` },
  { name: 'Valluvam Honey',              unit: '500 gm', price: 280, mrp: 350, img: `${V}/honey.jpeg` },
  { name: 'Palm Jaggery (Karupatti)',    unit: '500 gm', price: 199, mrp: 220, img: `${V}/palm-jaggery(500).jpeg` },
  { name: 'Palm Jaggery (Karupatti)',    unit: '1 Kg',   price: 389, mrp: 440, img: `${V}/palm-jaggery.jpeg` },
  { name: 'Buffalo Ghee',               unit: '250 gm', price: 370, mrp: 440, img: `${V}/buffalo(250).jpg` },
  { name: 'Buffalo Ghee',               unit: '500 gm', price: 740, mrp: 870, img: `${V}/buffalo(500).jpg` },
  { name: 'Pure Cow Ghee',              unit: '500 gm', price: 570, mrp: 670, img: `${V}/Ghee250.jpg` },
  { name: 'Nattu Sakkarai (Country Sugar)', unit: '200 gm', price: 25, mrp: 35, img: `${V}/palm-jaggery.jpeg` },
  { name: 'Palm Candy (Panangkarkandu)', unit: '200 gm', price: 60, mrp: 100, img: `${V}/palm-jaggery.jpeg` },
];

// ── DRY FRUITS ────────────────────────────────────────────────────────────
const DRY_FRUITS = [
  { name: 'Padam Pisin',        unit: '200 gm', price: 110, mrp: 150, img: `${D}/PadamPisin.jpg` },
  { name: 'Dates (Khajoor)',    unit: '200 gm', price: 89,  mrp: 119, img: `${D}/date.jpg` },
  { name: 'Dry Fig (Anjeer)',   unit: '100 gm', price: 130, mrp: 143, img: `${D}/fig.jpg` },
  { name: 'Dry Grapes Black',   unit: '200 gm', price: 80,  mrp: 119, img: `${D}/DryGrapesBlack.jpg` },
  { name: 'Dry Grapes Green',   unit: '100 gm', price: 55,  mrp: 62,  img: `${D}/drygrapesgreen.jpg` },
  { name: 'Dry Grapes Green',   unit: '200 gm', price: 105, mrp: 145, img: `${D}/drygrapesgreen.jpg` },
  { name: 'Dry Honey Amla',     unit: '200 gm', price: 75,  mrp: 85,  img: `${D}/honeyamla.jpg` },
  { name: 'Dry Kiwi',           unit: '200 gm', price: 95,  mrp: 130, img: `${D}/drykiwi.jpg` },
];

// ── NUTS & SEEDS ──────────────────────────────────────────────────────────
const NUTS = [
  { name: 'Cashew Nuts Whole',    unit: '200 gm', price: 195, mrp: 350, img: `${N}/CashewNutsWhole.jpg` },
  { name: 'Cashew Nuts W-240',    unit: '100 gm', price: 98,  mrp: 145, img: `${N}/CashewNutsWhole.jpg` },
  { name: 'Cashew Split',         unit: '100 gm', price: 98,  mrp: 120, img: `${N}/CashewSplit.jpg` },
  { name: 'Chia Seeds',           unit: '200 gm', price: 75,  mrp: 119, img: `${N}/chiaseeds.jpg` },
  { name: 'Cucumber Seeds',       unit: '200 gm', price: 240, mrp: 300, img: `${N}/CucumberSeeds.jpg` },
  { name: 'Flax Seeds',           unit: '200 gm', price: 48,  mrp: 60,  img: `${N}/flaxseeds.jpg` },
  { name: 'Pistachio (Pista)',    unit: '100 gm', price: 145, mrp: 170, img: `${N}/pista.jpg` },
  { name: 'Pistachio (Pista)',    unit: '200 gm', price: 290, mrp: 320, img: `${N}/pista.jpg` },
  { name: 'Pumpkin Seeds',        unit: '200 gm', price: 90,  mrp: 120, img: `${N}/PumpkinSeeds.jpg` },
  { name: 'Sunflower Seeds',      unit: '200 gm', price: 70,  mrp: 80,  img: `${N}/sunflowerseeds.jpg` },
  { name: 'Walnut Kernels',       unit: '200 gm', price: 310, mrp: 360, img: `${N}/walnut.jpg` },
];

// ── SPICES & MASALA ────────────────────────────────────────────────────────
const SPICES = [
  { name: 'Bay Leaves (Brinji)',        unit: '50 gm',  price: 12,  mrp: 15,  img: `${S}/bayleaves.jpg` },
  { name: 'Cardamom (Elaichi)',         unit: '50 gm',  price: 165, mrp: 180, img: `${S}/Cardamom.jpg` },
  { name: 'Cardamom (Elaichi)',         unit: '100 gm', price: 325, mrp: 340, img: `${S}/Cardamom.jpg` },
  { name: 'Cardamom (Elaichi)',         unit: '200 gm', price: 650, mrp: 750, img: `${S}/Cardamom.jpg` },
  { name: 'Cinnamon (Pattai)',          unit: '50 gm',  price: 24,  mrp: 30,  img: `${S}/Cinnamon.jpg` },
  { name: 'Cloves (Kirambu)',           unit: '50 gm',  price: 55,  mrp: 65,  img: `${S}/clove.jpg` },
  { name: 'Cloves (Kirambu)',           unit: '100 gm', price: 108, mrp: 130, img: `${S}/clove.jpg` },
  { name: 'Fennel Seeds (Sombu)',       unit: '200 gm', price: 49,  mrp: 60,  img: `${S}/FennelSeeds.jpg` },
  { name: 'Cumin Seeds (Jeera)',        unit: '200 gm', price: 70,  mrp: 115, img: `${S}/jeera.jpg` },
  { name: 'Methi Seeds (Fenugreek)',    unit: '200 gm', price: 29,  mrp: 40,  img: `${S}/Methi.jpg` },
  { name: 'Mustard Seeds (Kadugu)',     unit: '200 gm', price: 35,  mrp: 40,  img: `${S}/MustardSeeds.jpg` },
  { name: 'Black Pepper (Milagu)',      unit: '200 gm', price: 170, mrp: 199, img: `${S}/PepperBlack.jpg` },
  { name: 'Star Anise (Annasi Poo)',    unit: '50 gm',  price: 75,  mrp: 95,  img: `${S}/staranise.jpg` },
  { name: 'Star Anise (Annasi Poo)',    unit: '100 gm', price: 149, mrp: 180, img: `${S}/staranise.jpg` },
];

// ── COLD-PRESSED OILS ─────────────────────────────────────────────────────
const OILS = [
  { name: 'Valluvam Coconut Oil (Marachekku)',    unit: '1000 ml', price: 669, mrp: 736, img: `${O}/coconut-1L.jpg` },
  { name: 'Valluvam Coconut Oil (Marachekku)',    unit: '500 ml',  price: 349, mrp: 384, img: `${O}/coconutoil250.jpg` },
  { name: 'Valluvam Groundnut Oil (Marachekku)',  unit: '1 L',     price: 350, mrp: 385, img: `${O}/ground-1L.jpg` },
  { name: 'Valluvam Groundnut Oil (Marachekku)',  unit: '500 ml',  price: 190, mrp: 209, img: `${O}/groundnutoil250.jpg` },
  { name: 'Valluvam Sesame Oil (Marachekku)',     unit: '1 L',     price: 420, mrp: 462, img: `${O}/sesame-1L.jpg` },
  { name: 'Valluvam Sesame Oil (Marachekku)',     unit: '500 ml',  price: 260, mrp: 286, img: `${O}/sesame500.jpg` },
  { name: 'Sesame Oil + Coconut Oil Combo',       unit: '1L+500ml',price: 599, mrp: 699, img: `${O}/sesame-1L.jpg` },
];

// ── MILLETS ───────────────────────────────────────────────────────────────
const MILLETS = [
  { name: 'Barnyard Millet (Kuthiraivali)',  unit: '1 Kg',   price: 129, mrp: 150, img: `${M}/BarnyardMillet.jpg` },
  { name: 'Barnyard Millet (Kuthiraivali)',  unit: '500 gm', price: 89,  mrp: 110, img: `${M}/BarnyardMillet.jpg` },
  { name: 'Browntop Millet (Korale)',        unit: '1 Kg',   price: 149, mrp: 170, img: `${M}/BrowntopMillet.jpg` },
  { name: 'Browntop Millet (Korale)',        unit: '500 gm', price: 109, mrp: 130, img: `${M}/BrowntopMillet.jpg` },
  { name: 'Foxtail Millet (Thinai)',         unit: '1 Kg',   price: 105, mrp: 120, img: `${M}/foxtail-thinai.jpg` },
  { name: 'Foxtail Millet (Thinai)',         unit: '500 gm', price: 70,  mrp: 90,  img: `${M}/FoxtailMillet.jpg` },
  { name: 'Kodo Millet (Varagu)',            unit: '1 Kg',   price: 149, mrp: 170, img: `${M}/kodo-varagu.jpg` },
  { name: 'Kodo Millet (Varagu)',            unit: '500 gm', price: 89,  mrp: 110, img: `${M}/kodo-varagu.jpg` },
  { name: 'Little Millet (Samai)',           unit: '1 Kg',   price: 120, mrp: 130, img: `${M}/LittleMillet.jpg` },
  { name: 'Little Millet (Samai)',           unit: '500 gm', price: 70,  mrp: 80,  img: `${M}/LittleMillet.jpg` },
  { name: 'Pearl Millet (Kambu)',            unit: '1 Kg',   price: 95,  mrp: 110, img: `${M}/PearlMillet.jpg` },
  { name: 'Pearl Millet (Kambu)',            unit: '500 gm', price: 50,  mrp: 60,  img: `${M}/PearlMillet.jpg` },
  { name: 'Sorghum Cholam Red',             unit: '1 Kg',   price: 99,  mrp: 120, img: `${M}/Sorghum-Cholam(WHITE).jpg` },
  { name: 'Sorghum Cholam Red',             unit: '500 gm', price: 79,  mrp: 98,  img: `${M}/Sorghum-Cholam(WHITE).jpg` },
  { name: 'Sorghum Cholam White',           unit: '1 Kg',   price: 99,  mrp: 120, img: `${M}/Sorghum-Cholam(WHITE).jpg` },
  { name: 'Sorghum Cholam White',           unit: '500 gm', price: 79,  mrp: 98,  img: `${M}/Sorghum-Cholam(WHITE).jpg` },
];

const SEED_MAP = [
  { catSlug: 'valluvam',          products: VALLUVAM,   prefix: 'VAL' },
  { catSlug: 'dry-fruits',        products: DRY_FRUITS, prefix: 'DRY' },
  { catSlug: 'nuts',              products: NUTS,        prefix: 'NUT' },
  { catSlug: 'spices',            products: SPICES,      prefix: 'SPC' },
  { catSlug: 'cold-pressed-oils', products: OILS,        prefix: 'OIL' },
  { catSlug: 'millets',           products: MILLETS,     prefix: 'MLT' },
];

export async function GET() {
  try {
    const summary: Record<string, { created: number; updated: number; error?: string }> = {};

    for (const { catSlug, products, prefix } of SEED_MAP) {
      const category = await prisma.category.findUnique({ where: { slug: catSlug } });
      if (!category) {
        summary[catSlug] = { created: 0, updated: 0, error: 'Category not found — run /api/admin/setup-categories first' };
        continue;
      }

      let created = 0, updated = 0;

      for (const p of products) {
        const s   = makeSlug(p.name, p.unit);
        const sku = (prefix + s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);

        const existing = await prisma.product.findFirst({ where: { slug: s } });
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: p.name, price: p.price, mrp: p.mrp,
              unit: p.unit, imageUrls: JSON.stringify([p.img]),
              categoryId: category.id, isActive: true, inStock: true,
            },
          });
          updated++;
        } else {
          await prisma.product.create({
            data: {
              name: p.name, slug: s, price: p.price, mrp: p.mrp,
              unit: p.unit, imageUrls: JSON.stringify([p.img]),
              categoryId: category.id, sku,
              isActive: true, inStock: true, isFeatured: false,
            },
          });
          created++;
        }
      }

      summary[catSlug] = { created, updated };
    }

    const totalCreated = Object.values(summary).reduce((a, b) => a + b.created, 0);
    const totalUpdated = Object.values(summary).reduce((a, b) => a + b.updated, 0);

    return NextResponse.json({ ok: true, totalCreated, totalUpdated, summary });
  } catch (err) {
    console.error('[seed-pdf-products]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
