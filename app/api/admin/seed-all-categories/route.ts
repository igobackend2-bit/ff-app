import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function slug(name: string, unit: string) {
  return (name + '-' + unit).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const F = '/images/fruits';
const D = '/images/dryfruits';
const N = '/images/nuts';
const S = '/images/spices';
const O = '/images/oils';
const M = '/images/millets';
const V = '/images/valluvam';

// ── FRESH FRUITS (slug: fruits) ──────────────────────────────────────
const FRUITS = [
  { name: 'Elakki Banana',          unit: 'Per Dozen',  price: 45,  img: 'BananaElakki.jfif' },
  { name: 'Karpooravalli Banana',   unit: 'Per Dozen',  price: 40,  img: 'BananaKarpooravalli.jfif' },
  { name: 'Nendhiram Banana',       unit: '1 Kg',       price: 65,  img: 'BananaNendhiram.jfif' },
  { name: 'Poovan Banana',          unit: 'Per Dozen',  price: 35,  img: 'BananaPoovan.jfif' },
  { name: 'White Guava',            unit: '1 Kg',       price: 55,  img: 'GuavaWhite.jfif' },
  { name: 'Banganapalli Mango',     unit: '1 Kg',       price: 120, img: 'MangoBanganapalli.jfif' },
  { name: 'Musk Melon',             unit: '1 Kg',       price: 40,  img: 'MuskMelon.jfif' },
  { name: 'Pomegranate',            unit: '1 Kg',       price: 150, img: 'Pomegranate.jfif' },
  { name: 'Sapota (Chikoo)',        unit: '1 Kg',       price: 60,  img: 'Sapota.jfif' },
  { name: 'Senthooram Mango',       unit: '1 Kg',       price: 130, img: 'SenthooraMango.webp' },
  { name: 'Strawberry',             unit: '250 gm',     price: 90,  img: 'Strawberry.jfif' },
  { name: 'Sweet Lime (Mosambi)',   unit: '1 Kg',       price: 55,  img: 'SweetLime.jfif' },
  { name: 'Kiran Watermelon',       unit: '1 Kg',       price: 25,  img: 'WatermelonKiran.jfif' },
  { name: 'Strips Watermelon',      unit: '1 Kg',       price: 30,  img: 'WatermelonStrips.jfif' },
  { name: 'Amla (Gooseberry)',      unit: '250 gm',     price: 35,  img: 'amla.jfif' },
  { name: 'Apple',                  unit: '1 Kg',       price: 160, img: 'apple.jfif' },
  { name: 'Dragon Fruit',           unit: 'Per Piece',  price: 80,  img: 'droganfruit.jfif' },
  { name: 'Kiwi',                   unit: '3 Pcs',      price: 65,  img: 'kiwi.jfif' },
  { name: 'Orange',                 unit: '1 Kg',       price: 85,  img: 'orange.jfif' },
  { name: 'Papaya',                 unit: '1 Kg',       price: 35,  img: 'papaya.jfif' },
  { name: 'Pineapple',              unit: 'Per Piece',  price: 55,  img: 'pineapple.jfif' },
  { name: 'Red Banana',             unit: 'Per Dozen',  price: 60,  img: 'redbanana.jfif' },
];

// ── DRY FRUITS (slug: dry-fruits) ────────────────────────────────────
const DRY_FRUITS = [
  { name: 'Dry Grapes Black',   unit: '250 gm', price: 80,  img: 'DryGrapesBlack.jpg' },
  { name: 'Padam Pisin',        unit: '100 gm', price: 120, img: 'PadamPisin.jpg' },
  { name: 'Dates (Khajoor)',    unit: '500 gm', price: 150, img: 'date.jpg' },
  { name: 'Dry Grapes Green',   unit: '250 gm', price: 85,  img: 'drygrapesgreen.jpg' },
  { name: 'Dry Kiwi',           unit: '100 gm', price: 130, img: 'drykiwi.jpg' },
  { name: 'Anjeer (Figs)',      unit: '250 gm', price: 200, img: 'fig.jpg' },
  { name: 'Honey Amla',         unit: '250 gm', price: 120, img: 'honeyamla.jpg' },
];

// ── NUTS & SEEDS (slug: nuts) ─────────────────────────────────────────
const NUTS = [
  { name: 'Cashew Nuts W240',   unit: '250 gm', price: 280, img: 'CashewNutsWhole.jpg' },
  { name: 'Cashew Nuts Split',  unit: '250 gm', price: 250, img: 'CashewSplit.jpg' },
  { name: 'Cucumber Seeds',     unit: '100 gm', price: 45,  img: 'CucumberSeeds.jpg' },
  { name: 'Pumpkin Seeds',      unit: '100 gm', price: 80,  img: 'PumpkinSeeds.jpg' },
  { name: 'Chia Seeds',         unit: '100 gm', price: 90,  img: 'chiaseeds.jpg' },
  { name: 'Flax Seeds',         unit: '250 gm', price: 55,  img: 'flaxseeds.jpg' },
  { name: 'Pistachio (Pista)',  unit: '100 gm', price: 220, img: 'pista.jpg' },
  { name: 'Sunflower Seeds',    unit: '100 gm', price: 40,  img: 'sunflowerseeds.jpg' },
  { name: 'Walnut Kernels',     unit: '250 gm', price: 280, img: 'walnut.jpg' },
];

// ── SPICES & MASALA (slug: spices) ────────────────────────────────────
const SPICES = [
  { name: 'Cardamom (Elaichi)',       unit: '100 gm', price: 140, img: 'Cardamom.jpg' },
  { name: 'Cinnamon (Pattai)',        unit: '100 gm', price: 60,  img: 'Cinnamon.jpg' },
  { name: 'Fennel Seeds (Sombu)',     unit: '250 gm', price: 45,  img: 'FennelSeeds.jpg' },
  { name: 'Methi Seeds (Fenugreek)', unit: '250 gm', price: 25,  img: 'Methi.jpg' },
  { name: 'Mustard Seeds (Kadugu)',   unit: '250 gm', price: 20,  img: 'MustardSeeds.jpg' },
  { name: 'Black Pepper (Milagu)',    unit: '100 gm', price: 120, img: 'PepperBlack.jpg' },
  { name: 'Bay Leaves (Brinji)',      unit: '50 gm',  price: 15,  img: 'bayleaves.jpg' },
  { name: 'Cloves (Kirambu)',         unit: '50 gm',  price: 90,  img: 'clove.jpg' },
  { name: 'Cumin Seeds (Jeera)',      unit: '250 gm', price: 55,  img: 'jeera.jpg' },
  { name: 'Star Anise (Annasi Poo)', unit: '50 gm',  price: 40,  img: 'staranise.jpg' },
];

// ── COLD-PRESSED OILS (slug: cold-pressed-oils) ───────────────────────
const OILS = [
  { name: 'Coconut Oil Cold-Pressed',    unit: '1 L',    price: 280, img: 'coconut-1L.jpg' },
  { name: 'Coconut Oil Cold-Pressed',    unit: '250 ml', price: 80,  img: 'coconutoil250.jpg' },
  { name: 'Groundnut Oil Cold-Pressed',  unit: '1 L',    price: 220, img: 'ground-1L.jpg' },
  { name: 'Groundnut Oil Cold-Pressed',  unit: '250 ml', price: 60,  img: 'groundnutoil250.jpg' },
  { name: 'Sesame Oil Cold-Pressed',     unit: '1 L',    price: 320, img: 'sesame-1L.jpg' },
  { name: 'Sesame Oil Cold-Pressed',     unit: '500 ml', price: 170, img: 'sesame500.jpg' },
];

// ── MILLETS (slug: millets) ───────────────────────────────────────────
const MILLETS = [
  { name: 'Barnyard Millet (Kuthiraivali)', unit: '500 gm', price: 65,  img: 'BarnyardMillet.jpg' },
  { name: 'Browntop Millet (Korale)',       unit: '500 gm', price: 70,  img: 'BrowntopMillet.jpg' },
  { name: 'Foxtail Millet (Thinai)',        unit: '500 gm', price: 55,  img: 'FoxtailMillet.jpg' },
  { name: 'Foxtail Millet (Thinai)',        unit: '1 Kg',   price: 100, img: 'foxtail-thinai.jpg' },
  { name: 'Kodo Millet (Varagu)',           unit: '500 gm', price: 60,  img: 'kodo-varagu.jpg' },
  { name: 'Little Millet (Samai)',          unit: '500 gm', price: 65,  img: 'LittleMillet.jpg' },
  { name: 'Pearl Millet (Kambu)',           unit: '500 gm', price: 40,  img: 'PearlMillet.jpg' },
  { name: 'Sorghum (Cholam)',               unit: '500 gm', price: 35,  img: 'Sorghum-Cholam(WHITE).jpg' },
];

// ── DAIRY & GHEE (slug: dairy-ghee) ──────────────────────────────────
const DAIRY_GHEE = [
  { name: 'Pure Cow Ghee',    unit: '250 ml', price: 280, img: 'Ghee250.jpg' },
  { name: 'Buffalo Ghee',     unit: '250 ml', price: 220, img: 'buffalo(250).jpg' },
  { name: 'Buffalo Ghee',     unit: '500 ml', price: 420, img: 'buffalo(500).jpg' },
];

// ── HONEY (slug: honey) ───────────────────────────────────────────────
const HONEY = [
  { name: 'Pure Forest Honey', unit: '500 ml', price: 350, img: 'honey.jpeg' },
  { name: 'Pure Forest Honey', unit: '250 ml', price: 185, img: 'honey.jpeg' },
];

// ── VALLUVAM PRODUCTS (slug: valluvam) ────────────────────────────────
const VALLUVAM = [
  { name: 'Valluvam Pure Cow Ghee',  unit: '250 ml', price: 280, img: 'Ghee250.jpg' },
  { name: 'Valluvam Buffalo Ghee',   unit: '250 ml', price: 220, img: 'buffalo(250).jpg' },
  { name: 'Valluvam Buffalo Ghee',   unit: '500 ml', price: 420, img: 'buffalo(500).jpg' },
  { name: 'Valluvam Pure Honey',     unit: '500 ml', price: 350, img: 'honey.jpeg' },
  { name: 'Valluvam Palm Jaggery',   unit: '500 gm', price: 120, img: 'palm-jaggery(500).jpeg' },
  { name: 'Valluvam Palm Jaggery Block', unit: '1 Kg', price: 220, img: 'palm-jaggery.jpeg' },
];

// ── PALM JAGGERY (slug: palm-jaggery) ────────────────────────────────
const PALM_JAGGERY = [
  { name: 'Palm Jaggery',       unit: '500 gm', price: 120, img: 'palm-jaggery(500).jpeg' },
  { name: 'Palm Jaggery Block', unit: '1 Kg',   price: 220, img: 'palm-jaggery.jpeg' },
];

const SEED_MAP: Record<string, { products: { name: string; unit: string; price: number; img: string }[]; dir: string; prefix: string }> = {
  'fruits':           { products: FRUITS as any,      dir: F, prefix: 'FRT' },
  'dry-fruits':       { products: DRY_FRUITS as any,  dir: D, prefix: 'DRY' },
  'nuts':             { products: NUTS as any,         dir: N, prefix: 'NUT' },
  'spices':           { products: SPICES as any,       dir: S, prefix: 'SPC' },
  'cold-pressed-oils':{ products: OILS as any,         dir: O, prefix: 'OIL' },
  'millets':          { products: MILLETS as any,      dir: M, prefix: 'MLT' },
  'dairy-ghee':       { products: DAIRY_GHEE as any,  dir: V, prefix: 'GHE' },
  'honey':            { products: HONEY as any,        dir: V, prefix: 'HNY' },
  'valluvam':         { products: VALLUVAM as any,     dir: V, prefix: 'VAL' },
  'palm-jaggery':     { products: PALM_JAGGERY as any, dir: V, prefix: 'JGR' },
};

export async function GET() {
  try {
    const summary: Record<string, { created: number; updated: number; error?: string }> = {};

    for (const [catSlug, { products, dir, prefix }] of Object.entries(SEED_MAP)) {
      const category = await prisma.category.findUnique({ where: { slug: catSlug } });
      if (!category) {
        summary[catSlug] = { created: 0, updated: 0, error: 'category not found — run /api/admin/setup-categories first' };
        continue;
      }

      let created = 0, updated = 0;

      for (const p of products) {
        const s    = slug(p.name, p.unit);
        const imgs = JSON.stringify([`${dir}/${p.img}`]);
        const sku  = (prefix + '-' + s).slice(0, 50).toUpperCase().replace(/-/g, '').replace(/[^A-Z0-9]/g, '');

        const existing = await prisma.product.findFirst({ where: { slug: s } });
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data:  { name: p.name, price: p.price, mrp: Math.round(p.price * 1.15), unit: p.unit, imageUrls: imgs, categoryId: category.id, isActive: true, inStock: true },
          });
          updated++;
        } else {
          await prisma.product.create({
            data: {
              name: p.name, slug: s, price: p.price, mrp: Math.round(p.price * 1.15),
              unit: p.unit, imageUrls: imgs, categoryId: category.id,
              sku: sku.slice(0, 50), isActive: true, inStock: true, isFeatured: false,
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
    console.error('[seed-all-categories]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
