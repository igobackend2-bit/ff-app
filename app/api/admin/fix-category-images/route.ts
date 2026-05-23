import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/fix-category-images
 * Updates ALL category imageUrls to use local /images/category/ icons.
 */
const C = '/images/category';
const IMAGE_MAP: Record<string, string> = {
  'fruits':            `${C}/freshfruitscategory.png`,
  'farm-fresh':        `${C}/freshvegtablecategory.png`,
  'vegetables':        `${C}/freshvegtablecategory.png`,
  'valluvam':          `${C}/valluvamproductscategory.png`,
  'dry-fruits':        `${C}/dryfruitscategory.png`,
  'nuts':              `${C}/nutscategory.png`,
  'spices':            `${C}/spicescategory.png`,
  'cold-pressed-oils': `${C}/oilcategory.png`,
  'millets':           `${C}/milletscategory.png`,
  'dairy-ghee':        `${C}/gheecategory.png`,
  'honey':             `${C}/honeycategory.png`,
  'palm-jaggery':      `${C}/valluvamproductscategory.png`,
};

export async function GET() {
  try {
    const results: { slug: string; imageUrl: string }[] = [];

    for (const [slug, imageUrl] of Object.entries(IMAGE_MAP)) {
      const cat = await prisma.category.findUnique({ where: { slug } });
      if (!cat) continue;

      await prisma.category.update({
        where: { slug },
        data:  { imageUrl },
      });
      results.push({ slug, imageUrl });
    }

    return NextResponse.json({ ok: true, updated: results.length, results });
  } catch (err) {
    console.error('[fix-category-images]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
