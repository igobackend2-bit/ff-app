import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  // In production: call Google Maps Geocoding API
  // For now, we mock it with Chennai context as requested
  return NextResponse.json({
    address: 'Adyar, Chennai',
    pincode: '600020',
    city: 'Chennai',
    storeId: 'store-chennai-main',
    storeName: 'Farmers Factory Chennai',
    etaMinutes: 45,
  });
}
