import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

// TEMP read-only debug — dump all columns of one product row.
export async function GET() {
  const r = await sbAdmin<any[]>('products', {
    query: 'id=eq.731e205d-fc22-4481-ba8f-afcf48e08c2d&select=*',
  });
  const row = Array.isArray(r.data) ? r.data[0] : null;
  return NextResponse.json({ keys: row ? Object.keys(row) : [], row });
}
