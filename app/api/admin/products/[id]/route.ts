// Admin: Get / Update / Delete single product
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const product = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: { brand: true, category: true },
    });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const formattedProduct = {
      ...product,
      imageUrls: typeof product.imageUrls === 'string' ? JSON.parse(product.imageUrls || '[]') : product.imageUrls,
      blurDataUrls: typeof product.blurDataUrls === 'string' ? JSON.parse(product.blurDataUrls || '[]') : product.blurDataUrls,
      tags: typeof product.tags === 'string' ? JSON.parse(product.tags || '[]') : product.tags,
    };
    return NextResponse.json({ product: formattedProduct });
  } catch (err) {
    console.error('[admin/products/:id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const {
      name, description, price, mrp, unit, tags,
      imageUrls, blurDataUrls, inStock, isFeatured,
      averageRating, reviewCount,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data['name'] = name;
    if (description !== undefined) data['description'] = description;
    if (price !== undefined) data['price'] = Number(price);
    if (mrp !== undefined) data['mrp'] = Number(mrp);
    if (unit !== undefined) data['unit'] = unit;
    if (tags !== undefined) data['tags'] = JSON.stringify(tags);
    if (imageUrls !== undefined) data['imageUrls'] = JSON.stringify(imageUrls);
    if (blurDataUrls !== undefined) data['blurDataUrls'] = JSON.stringify(blurDataUrls);
    if (inStock !== undefined) data['inStock'] = Boolean(inStock);
    if (isFeatured !== undefined) data['isFeatured'] = Boolean(isFeatured);
    if (averageRating !== undefined) data['averageRating'] = Math.min(5, Math.max(0, Number(averageRating)));
    if (reviewCount !== undefined) data['reviewCount'] = Math.max(0, Math.round(Number(reviewCount)));

    const product = await prisma.product.update({
      where: { id: resolvedParams.id },
      data,
    });

    // sortOrder is not in Prisma schema → update via raw SQL if provided
    if (body.sortOrder !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Product" SET "sortOrder" = ? WHERE id = ?`,
          Number(body.sortOrder), resolvedParams.id,
        );
      } catch {
        // column may not exist yet; caller should run /api/admin/setup-sort once
        // to add the column, then this will start working
      }
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error('[admin/products/:id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    await prisma.product.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/products/:id DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
