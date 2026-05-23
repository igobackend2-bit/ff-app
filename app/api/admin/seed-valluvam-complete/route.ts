import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const V = '/images/valluvam';

function makeSlug(name: string, unit: string) {
  return (name + '-' + unit + '-val')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ALL_VALLUVAM = [
  { name: 'Valluvam Honey',                    unit: '250 gm',  price: 140, mrp: 190, img: `${V}/honey.jpeg` },
  { name: 'Valluvam Honey',                    unit: '500 gm',  price: 280, mrp: 350, img: `${V}/honey.jpeg` },
  { name: 'Palm Jaggery (Karupatti)',           unit: '500 gm',  price: 199, mrp: 220, img: `${V}/palm-jaggery(500).jpeg` },
  { name: 'Palm Jaggery (Karupatti)',           unit: '1 Kg',    price: 389, mrp: 440, img: `${V}/palm-jaggery.jpeg` },
  { name: 'Nattu Sakkarai (Country Sugar)',     unit: '200 gm',  price: 25,  mrp: 35,  img: `${V}/palm-jaggery.jpeg` },
  { name: 'Palm Candy (Panangkarkandu)',        unit: '200 gm',  price: 60,  mrp: 100, img: `${V}/palm-jaggery.jpeg` },
  { name: 'Buffalo Ghee',                      unit: '250 gm',  price: 370, mrp: 440, img: `${V}/buffalo(250).jpg` },
  { name: 'Buffalo Ghee',                      unit: '500 gm',  price: 740, mrp: 870, img: `${V}/buffalo(500).jpg` },
  { name: 'Pure Cow Ghee',                     unit: '500 gm',  price: 570, mrp: 670, img: `${V}/Ghee250.jpg` },
  { name: 'Valluvam Coconut Oil (Marachekku)', unit: '500 ml',  price: 349, mrp: 384, img: `${V}/coconutoil250.jpg` },
  { name: 'Valluvam Coconut Oil (Marachekku)', unit: '1000 ml', price: 669, mrp: 736, img: `${V}/coconut-1L.jpg` },
  { name: 'Valluvam Groundnut Oil (Marachekku)', unit: '500 ml', price: 190, mrp: 209, img: `${V}/groundnutoil250.jpg` },
  { name: 'Valluvam Groundnut Oil (Marachekku)', unit: '1 L',   price: 350, mrp: 385, img: `${V}/ground-1L.jpg` },
  { name: 'Valluvam Sesame Oil (Marachekku)',  unit: '500 ml',  price: 260, mrp: 286, img: `${V}/sesame500.jpg` },
  { name: 'Valluvam Sesame Oil (Marachekku)',  unit: '1 L',     price: 420, mrp: 462, img: `${V}/sesame-1L.jpg` },
  { name: 'Barnyard Millet (Kuthiraivali)',    unit: '1 Kg',    price: 129, mrp: 150, img: `${V}/BarnyardMillet.jpg` },
  { name: 'Browntop Millet (Korale)',          unit: '1 Kg',    price: 149, mrp: 170, img: `${V}/BrowntopMillet.jpg` },
  { name: 'Foxtail Millet (Thinai)',           unit: '500 gm',  price: 70,  mrp: 90,  img: `${V}/FoxtailMillet.jpg` },
  { name: 'Foxtail Millet (Thinai)',           unit: '1 Kg',    price: 105, mrp: 120, img: `${V}/foxtail-thinai.jpg` },
  { name: 'Kodo Millet (Varagu)',              unit: '1 Kg',    price: 149, mrp: 170, img: `${V}/kodo-varagu.jpg` },
  { name: 'Little Millet (Samai)',             unit: '1 Kg',    price: 120, mrp: 130, img: `${V}/LittleMillet.jpg` },
  { name: 'Pearl Millet (Kambu)',              unit: '1 Kg',    price: 95,  mrp: 110, img: `${V}/PearlMillet.jpg` },
  { name: 'Sorghum Cholam White',             unit: '1 Kg',    price: 99,  mrp: 120, img: `${V}/Sorghum-Cholam(WHITE).jpg` },
  { name: 'Bay Leaves (Brinji)',               unit: '50 gm',   price: 12,  mrp: 15,  img: `${V}/bayleaves.jpg` },
  { name: 'Cardamom (Elaichi)',                unit: '50 gm',   price: 165, mrp: 180, img: `${V}/Cardamom.jpg` },
  { name: 'Cinnamon (Pattai)',                 unit: '50 gm',   price: 24,  mrp: 30,  img: `${V}/Cinnamon.jpg` },
  { name: 'Cloves (Kirambu)',                  unit: '50 gm',   price: 55,  mrp: 65,  img: `${V}/clove.jpg` },
  { name: 'Fennel Seeds (Sombu)',              unit: '200 gm',  price: 49,  mrp: 60,  img: `${V}/FennelSeeds.jpg` },
  { name: 'Cumin Seeds (Jeera)',               unit: '200 gm',  price: 70,  mrp: 115, img: `${V}/jeera.jpg` },
  { name: 'Methi Seeds (Fenugreek)',           unit: '200 gm',  price: 29,  mrp: 40,  img: `${V}/Methi.jpg` },
  { name: 'Mustard Seeds (Kadugu)',            unit: '200 gm',  price: 35,  mrp: 40,  img: `${V}/MustardSeeds.jpg` },
  { name: 'Black Pepper (Milagu)',             unit: '200 gm',  price: 170, mrp: 199, img: `${V}/PepperBlack.jpg` },
  { name: 'Star Anise (Annasi Poo)',           unit: '50 gm',   price: 75,  mrp: 95,  img: `${V}/staranise.jpg` },
  { name: 'Cashew Nuts Whole',                 unit: '200 gm',  price: 195, mrp: 350, img: `${V}/CashewNutsWhole.jpg` },
  { name: 'Cashew Split',                      unit: '100 gm',  price: 98,  mrp: 120, img: `${V}/CashewSplit.jpg` },
  { name: 'Chia Seeds',                        unit: '200 gm',  price: 75,  mrp: 119, img: `${V}/chiaseeds.jpg` },
  { name: 'Cucumber Seeds',                    unit: '200 gm',  price: 240, mrp: 300, img: `${V}/CucumberSeeds.jpg` },
  { name: 'Flax Seeds',                        unit: '200 gm',  price: 48,  mrp: 60,  img: `${V}/flaxseeds.jpg` },
  { name: 'Pistachio (Pista)',                 unit: '100 gm',  price: 145, mrp: 170, img: `${V}/pista.jpg` },
  { name: 'Pumpkin Seeds',                     unit: '200 gm',  price: 90,  mrp: 120, img: `${V}/PumpkinSeeds.jpg` },
  { name: 'Sunflower Seeds',                   unit: '200 gm',  price: 70,  mrp: 80,  img: `${V}/sunflowerseeds.jpg` },
  { name: 'Walnut Kernels',                    unit: '200 gm',  price: 310, mrp: 360, img: `${V}/walnut.jpg` },
  { name: 'Dates (Khajoor)',                   unit: '200 gm',  price: 89,  mrp: 119, img: `${V}/date.jpg` },
  { name: 'Dry Grapes Black',                  unit: '200 gm',  price: 80,  mrp: 119, img: `${V}/DryGrapesBlack.jpg` },
  { name: 'Dry Grapes Green',                  unit: '100 gm',  price: 55,  mrp: 62,  img: `${V}/drygrapesgreen.jpg` },
  { name: 'Dry Kiwi',                          unit: '200 gm',  price: 95,  mrp: 130, img: `${V}/drykiwi.jpg` },
  { name: 'Dry Fig (Anjeer)',                  unit: '100 gm',  price: 130, mrp: 143, img: `${V}/fig.jpg` },
  { name: 'Dry Honey Amla',                    unit: '200 gm',  price: 75,  mrp: 85,  img: `${V}/honeyamla.jpg` },
  { name: 'Padam Pisin',                       unit: '200 gm',  price: 110, mrp: 150, img: `${V}/PadamPisin.jpg` },
];

export async function GET() {
  try {
    const cat = await prisma.category.findUnique({ where: { slug: 'valluvam' } });
    if (!cat) {
      return NextResponse.json({ error: 'valluvam category not found — run /api/admin/setup-categories first' }, { status: 404 });
    }

    let created = 0, updated = 0;

    for (const p of ALL_VALLUVAM) {
      const s = makeSlug(p.name, p.unit);
      const existing = await prisma.product.findFirst({ where: { slug: s } });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: cat.id, isActive: true, inStock: true,
          },
        });
        updated++;
      } else {
        const sku = ('VALC' + s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);
        await prisma.product.create({
          data: {
            name: p.name, slug: s, price: p.price, mrp: p.mrp, unit: p.unit,
            imageUrls: JSON.stringify([p.img]),
            categoryId: cat.id, sku,
            isActive: true, inStock: true, isFeatured: false,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: ALL_VALLUVAM.length,
      created,
      updated,
      message: `Valluvam category now has all ${created + updated} products with /images/valluvam/ images`,
    });
  } catch (err) {
    console.error('[seed-valluvam-complete]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
