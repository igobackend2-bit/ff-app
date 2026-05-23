// Admin: Get / Update single order + stock restore on cancel + notifications
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_STATUSES = [
  'PLACED', 'CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'placed', CONFIRMED: 'confirmed', PICKING: 'being picked',
  OUT_FOR_DELIVERY: 'out for delivery', DELIVERED: 'delivered',
  CANCELLED: 'cancelled', REFUNDED: 'refunded',
};

async function ensureNotifTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS AppNotification (
      id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'INFO',
      title TEXT NOT NULL, message TEXT NOT NULL,
      targetUserId TEXT, orderId TEXT,
      isAdminRead INTEGER NOT NULL DEFAULT 0,
      isUserRead  INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);
  try { await prisma.$executeRawUnsafe(`ALTER TABLE AppNotification ADD COLUMN isUserRead INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user:    { select: { id: true, name: true, phone: true } },
        items:   { include: { product: true } },
        address: true,
      },
    });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[admin/orders/:id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body   = await req.json() as { status?: string };
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    // Fetch current order + items BEFORE updating (needed for stock restore)
    const current = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Update status
    const order = await prisma.order.update({
      where: { id },
      data:  { status },
      select: { id: true, status: true, updatedAt: true, orderNumber: true, userId: true },
    });

    // ── Inventory decrease: first time order leaves PLACED ──────────────────
    // Triggers on CONFIRMED, PICKING, OUT_FOR_DELIVERY, or DELIVERED
    // (catches cases where CONFIRMED step is skipped)
    const STORE_ID = 'main-store';
    const DECREASE_TRIGGERS = ['CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (current.status === 'PLACED' && DECREASE_TRIGGERS.includes(status)) {
      for (const item of current.items) {
        try {
          const existing = await prisma.inventory.findUnique({
            where: { productId_darkStoreId: { productId: item.productId, darkStoreId: STORE_ID } },
          });
          if (existing) {
            const newQty = Math.max(0, existing.quantity - item.quantity);
            await prisma.inventory.update({
              where: { productId_darkStoreId: { productId: item.productId, darkStoreId: STORE_ID } },
              data:  { quantity: newQty },
            });
            if (newQty === 0) {
              await prisma.product.update({ where: { id: item.productId }, data: { inStock: false } });
            }
          } else {
            // No inventory record — create one at 0 so it shows out of stock
            await prisma.inventory.create({
              data: { productId: item.productId, darkStoreId: STORE_ID, quantity: 0, threshold: 10 },
            });
            await prisma.product.update({ where: { id: item.productId }, data: { inStock: false } });
          }
        } catch (sErr) {
          console.error('[stock-decrease]', sErr);
        }
      }
    }

    // ── Restore inventory if order was CANCELLED ─────────────────────────────
    if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
      for (const item of current.items) {
        try {
          const existing = await prisma.inventory.findUnique({
            where: { productId_darkStoreId: { productId: item.productId, darkStoreId: STORE_ID } },
          });
          if (existing) {
            await prisma.inventory.update({
              where: { productId_darkStoreId: { productId: item.productId, darkStoreId: STORE_ID } },
              data:  { quantity: existing.quantity + item.quantity },
            });
          }
          await prisma.product.update({ where: { id: item.productId }, data: { inStock: true } });
        } catch (sErr) {
          console.error('[stock-restore]', sErr);
        }
      }
    }

    // ── Create status-change notification ────────────────────────────────────
    try {
      await ensureNotifTable();
      const nid   = 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const label = STATUS_LABELS[status] ?? status.toLowerCase();
      await prisma.$executeRawUnsafe(
        `INSERT INTO AppNotification (id,type,title,message,targetUserId,orderId,isAdminRead,isUserRead,createdAt)
         VALUES (?,?,?,?,?,?,0,0,?)`,
        nid, 'ORDER_STATUS',
        `Order #${order.orderNumber} ${label}`,
        `Your order #${order.orderNumber} has been ${label}.`,
        order.userId, order.id, new Date().toISOString(),
      );
    } catch (nErr) {
      console.error('[notif-status]', nErr);
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error('[admin/orders/:id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
