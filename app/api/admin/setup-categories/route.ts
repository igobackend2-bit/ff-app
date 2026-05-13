/**
 * GET /api/admin/setup-categories
 * One-time setup: upserts all categories with real Unsplash images.
 * Safe to call multiple times (upsert by slug).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/* Real Unsplash images — reliable public CDN */
const CATEGORIES = [
  {
    name: 'Farm Fresh Vegetables',
    slug: 'farm-fresh',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80',
    description: 'Organic vegetables directly from Karnataka farms',
  },
  {
    name: 'Fresh Fruits',
    slug: 'fruits',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&q=80',
    description: 'Seasonal fresh fruits harvested daily',
  },
  {
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1604910931144-2af7a75f4b5c?w=200&q=80',
    description: 'Premium dry fruits — cashews, almonds, raisins and more',
  },
  {
    name: 'Nuts',
    slug: 'nuts',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&q=80',
    description: 'Mixed nuts — peanuts, walnuts, pistachios',
  },
  {
    name: 'Spices & Masala',
    slug: 'spices',
    sortOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80',
    description: 'Pure hand-ground spices and masalas',
  },
  {
    name: 'Cold-Pressed Oils',
    slug: 'cold-pressed-oils',
    sortOrder: 6,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&q=80',
    description: 'Groundnut, sesame, coconut and mustard oils',
  },
  {
    name: 'Millets',
    slug: 'millets',
    sortOrder: 7,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80',
    description: 'Jowar, bajra, ragi, foxtail and barnyard millets',
  },
  {
    name: 'Dairy & Ghee',
    slug: 'dairy-ghee',
    sortOrder: 8,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
    description: 'Pure cow ghee, butter and dairy products',
  },
  {
    name: 'Honey',
    slug: 'honey',
    sortOrder: 9,
    imageUrl: 'https://images.unsplash.com/photo-1471943038054-b4d9297f5d42?w=200&q=80',
    description: 'Raw forest honey and infused honeys',
  },
  {
    name: 'Palm Jaggery',
    slug: 'palm-jaggery',
    sortOrder: 10,
    imageUrl: 'https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=200&q=80',
    description: 'Nattu sakkarai, palm jaggery and country sugar',
  },
  {
    name: 'Traditional Rice',
    slug: 'traditional-rice',
    sortOrder: 11,
    imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&q=80',
    description: 'Heirloom and traditional rice varieties from Tamil Nadu',
  },
  {
    name: 'Valluvam Products',
    slug: 'valluvam',
    sortOrder: 12,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80',
    description: 'Authentic traditional products from Tamil Nadu by Valluvam',
  },
  {
    name: 'Pickles & Chutneys',
    slug: 'pickles',
    sortOrder: 13,
    imageUrl: 'https://images.unsplash.com/photo-1567608285969-48e4bbe0d399?w=200&q=80',
    description: 'Home-style pickles and chutneys made with no preservatives',
  },
  {
    name: 'Organic Grains',
    slug: 'grains-pulses',
    sortOrder: 14,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=80',
    description: 'Organic wheat, pulses, lentils and legumes',
  },
  {
    name: 'Daily Essentials',
    slug: 'essentials',
    sortOrder: 15,
    imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=200&q=80',
    description: 'Everyday grocery staples',
  },
];

export async function GET() {
  try {
    const results: string[] = [];

    for (const cat of CATEGORIES) {
      await prisma.category.upsert({
        where:  { slug: cat.slug },
        update: { imageUrl: cat.imageUrl, name: cat.name, sortOrder: cat.sortOrder, isActive: true },
        create: {
          name:        cat.name,
          slug:        cat.slug,
          imageUrl:    cat.imageUrl,
          description: cat.description,
          sortOrder:   cat.sortOrder,
          isActive:    true,
          metaTitle:        `${cat.name} — Farmers Factory`,
          metaDescription:  `Buy ${cat.name.toLowerCase()} online. 24-hour delivery.`,
          ogImageUrl:  cat.imageUrl,
        },
      });
      results.push(cat.slug);
    }

    return NextResponse.json({
      success: true,
      message: `Updated/created ${results.length} categories`,
      categories: results,
    });
  } catch (err) {
    console.error('[setup-categories]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
