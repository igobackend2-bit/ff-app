// PATCH /api/admin/inventory/update
// Body: { productId: string, quantity: number, threshold?: number }
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STORE_ID = 'main-store';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { productId: string; quantity: number; threshold?: number };
    const { productId, quantity, threshold = 10 } = body;

    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    const qty = Math.max(0, Math.round(Number(quantity)));

    // Ensure store exists
    await prisma.darkStore.upsert({
      where:  { id: STORE_ID },
      create: { id: STORE_ID, name: 'Main Store', city: 'Chennai', pincode: '600001', lat: 13.08, lng: 80.27, isActive: true },
      update: {},
    });

    // Upsert inventory record
    const inv = await prisma.inventory.upsert({
      where:  { productId_darkStoreId: { productId, darkStoreId: STORE_ID } },
      create: { productId, darkStoreId: STORE_ID, quantity: qty, threshold },
      update: { quantity: qty, threshold },
    });

    // Sync product.inStock
    await prisma.product.update({
      where: { id: productId },
      data:  { inStock: qty > 0 },
    });

    return NextResponse.json({ ok: true, quantity: inv.quantity, inStock: qty > 0 });
  } catch (err) {
    console.error('[inventory/update]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
