import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit  = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const q      = searchParams.get('q') ?? '';
    const offset = (page - 1) * limit;
    const filters: string[] = [];
    if (q) filters.push(`name=ilike.*${encodeURIComponent(q)}*`);
    const filterStr = filters.length ? filters.join('&') + '&' : '';

    const [dataRes, countRes] = await Promise.all([
      fetch(`${SB}/rest/v1/users?${filterStr}order=created_at.desc&limit=${limit}&offset=${offset}`, { headers: H, cache: 'no-store' }),
      fetch(`${SB}/rest/v1/users?${filterStr}select=id`, { headers: { ...H, Prefer: 'count=exact' }, cache: 'no-store' }),
    ]);
    const users: any[] = await dataRes.json();
    const range = countRes.headers.get('content-range');
    const total = range ? parseInt(range.split('/')[1] ?? '0', 10) : users.length;
    const formatted = users.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, loyaltyPoints: u.loyalty_points, createdAt: u.created_at }));
    return NextResponse.json({ users: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
