import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const NAME_FIXES: Record<string, string> = {
  'farm-fresh': 'Fresh Vegetables',
};

export async function GET() {
  const results = [];
  for (const [slug, name] of Object.entries(NAME_FIXES)) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    await prisma.category.update({ where: { slug }, data: { name } });
    results.push({ slug, name });
  }
  return NextResponse.json({ ok: true, results });
}
