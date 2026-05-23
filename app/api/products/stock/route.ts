// Public: lightweight stock-quantity check for a single product
// GET /api/products/stock?productId=xxx  →  { qty: number }
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STORE_ID = 'main-store';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ qty: null }, { status: 400 });

    const inv = await prisma.inventory.findUnique({
      where: { productId_darkStoreId: { productId, darkStoreId: STORE_ID } },
      select: { quantity: true },
    });

    // If no inventory record exists we don't know — return null (unlimited)
    return NextResponse.json({ qty: inv ? inv.quantity : null });
  } catch (err) {
    console.error('[GET /api/products/stock]', err);
    return NextResponse.json({ qty: null }, { status: 500 });
  }
}
