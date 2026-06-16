// Admin: List users — derived from ERP sales_orders (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SB = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const q     = (searchParams.get('q') ?? '').toLowerCase();

    // Derive unique customers from sales_orders
    const res = await fetch(
      `${SB}/rest/v1/sales_orders?select=customer_name,created_at&order=created_at.desc&limit=500`,
      { headers: H, cache: 'no-store' },
    );

    if (!res.ok) throw new Error(await res.text());
    const rows: Array<{ customer_name: string; created_at: string }> = await res.json();

    // Deduplicate by name, extract phone from "Name (phone)" format
    const seen = new Set<string>();
    const users = rows
      .map((r) => {
        const match = r.customer_name.match(/^(.+?)\s*\((\d+)\)$/);
        return {
          id:        r.customer_name,
          name:      match ? match[1].trim() : r.customer_name,
          phone:     match ? match[2] : '',
          email:     '',
          createdAt: r.created_at,
          loyaltyPoints: 0,
          _count:    { orders: 1 },
          addresses: [],
        };
      })
      .filter((u) => {
        if (q && !u.name.toLowerCase().includes(q) && !u.phone.includes(q)) return false;
        if (seen.has(u.name)) return false;
        seen.add(u.name);
        return true;
      });

    const total    = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ users: paginated, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ users: [], total: 0, page: 1, pages: 0 });
  }
}
