import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/setup-sort
 * Adds sortOrder column + sets default priority order for key products.
 * Safe to call multiple times.
 */
export async function GET() {
  try {
    // 1. Add sortOrder column (ignore duplicate column error)
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`,
      );
    } catch (e) {
      if (!String(e).includes('duplicate column')) throw e;
    }

    // 2. Set sortOrder for priority products (only where currently 0)
    const priorities: Array<[string, number]> = [
      ['honey',  1],
      ['onion',  2],
      ['tomato', 3],
      ['potato', 4],
      ['garlic', 5],
      ['ginger', 6],
    ];

    let updated = 0;
    for (const pair of priorities) {
      const keyword = pair[0];
      const sortNum = pair[1];
      const res = await prisma.$executeRawUnsafe(
        `UPDATE "Product" SET "sortOrder" = ? WHERE LOWER(name) LIKE ? AND "sortOrder" = 0`,
        sortNum,
        `%${keyword}%`,
      );
      updated += Number(res);
    }

    const countRows = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
      `SELECT COUNT(*) AS cnt FROM "Product" WHERE "sortOrder" > 0`,
    );
    const cnt = Number(countRows[0]?.cnt ?? 0);

    return NextResponse.json({
      ok: true,
      message: `sortOrder column ready. Updated ${updated} products. ${cnt} products have a sort order set.`,
    });
  } catch (err) {
    console.error('[setup-sort]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/setup-sort
 * Body: { productId: string, sortOrder: number }
 * Updates sortOrder for a single product (inline edit from admin list).
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json() as { productId: string; sortOrder: number };
    if (!body.productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }
    const sortVal = Math.max(0, Math.round(Number(body.sortOrder)));
    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET "sortOrder" = ? WHERE id = ?`,
      sortVal,
      body.productId,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
