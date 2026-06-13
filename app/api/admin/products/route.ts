// Admin: List products — proxies to legacy API (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const LEGACY_API = 'https://ff-app-pi.vercel.app/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const search = searchParams.get('q') ?? '';
    const category = searchParams.get('category') ?? '';

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('q', search);
    if (category) params.set('category', category);

    const res = await fetch(`${LEGACY_API}/products?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Legacy API ${res.status}`);
    const json = await res.json() as { products?: unknown[]; data?: unknown[]; total?: number; pages?: number };

    const products = json.products ?? json.data ?? [];
    const total = json.total ?? (products as unknown[]).length;

    return NextResponse.json({ products, total, page, pages: json.pages ?? Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/products GET]', err);
    return NextResponse.json({ products: [], total: 0, page: 1, pages: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${LEGACY_API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/products POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
