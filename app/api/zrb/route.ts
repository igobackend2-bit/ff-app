import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';
import { cleanProductName, localizeImageUrls } from '@/lib/clean-name';
import { resolveCategory } from '@/lib/category-resolver';
import { resolveImageByName } from '@/lib/product-image-resolver';

export async function GET() {
  const r = await sbAdmin<any[]>('products', {
    query: "name=ilike.*banana*&select=id,name,slug,category,category_slug,price,mrp,in_stock,image_url,image_urls&limit=10",
  });
  const rows = Array.isArray(r.data) ? r.data : [];
  return NextResponse.json(rows.map((p) => {
    const cleanName = cleanProductName(p.name, p.slug);
    const rc = resolveCategory(cleanName, p.category_slug);
    const catSlug = rc?.slug ?? p.category_slug;
    return {
      raw_name: p.name, slug: p.slug, db_category_slug: p.category_slug,
      cleanName, resolvedCat: rc, catSlug,
      byName: resolveImageByName(cleanName, catSlug),
      byRawName: resolveImageByName(p.name, catSlug),
      db_image_url: p.image_url, db_image_urls: p.image_urls,
      price: p.price,
    };
  }));
}
