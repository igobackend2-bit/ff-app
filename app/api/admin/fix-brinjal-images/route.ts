import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const FIXES = [
  { nameContains: 'Brinjal Vari',      img: '/images/vegtables/BrinjalVari.jfif' },
  { nameContains: 'Brinjal Ujala',     img: '/images/vegtables/Brinjal.jfif'     },
  { nameContains: 'Brinjal Eggplant',  img: '/images/vegtables/BrinjalEggplant.jfif' },
];

export async function GET() {
  const results = [];

  for (const fix of FIXES) {
    const products = await prisma.product.findMany({
      where: { name: { contains: fix.nameContains } },
    });

    for (const p of products) {
      await prisma.product.update({
        where: { id: p.id },
        data:  { imageUrls: JSON.stringify([fix.img]) },
      });
      results.push({ name: p.name, unit: p.unit, img: fix.img });
    }
  }

  return NextResponse.json({ ok: true, updated: results.length, results });
}
