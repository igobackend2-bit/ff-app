import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    // Real reverse geocoding via Nominatim (free, no API key needed)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'FarmersFactory/1.0',
        },
      },
    );

    if (!res.ok) throw new Error('Nominatim failed');

    const data = await res.json() as {
      display_name?: string;
      address?: {
        suburb?: string; neighbourhood?: string; road?: string;
        city?: string; town?: string; county?: string;
        state?: string; postcode?: string;
      };
    };

    const a        = data.address ?? {};
    const locality = a.suburb ?? a.neighbourhood ?? a.road ?? '';
    const city     = a.city ?? a.town ?? a.county ?? 'Chennai';
    const state    = a.state ?? '';
    const pincode  = a.postcode ?? '';
    const address  = [locality, city].filter(Boolean).join(', ')
                     || data.display_name?.split(',')[0]
                     || city;

    return NextResponse.json({
      address,
      pincode,
      city,
      state,
      storeId: 'store-chennai-main',
      storeName: 'Farmers Factory',
      etaMinutes: 45,
    });
  } catch {
    // Graceful fallback
    return NextResponse.json({
      address: `${parseFloat(lat).toFixed(3)}°N, ${parseFloat(lng).toFixed(3)}°E`,
      pincode: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      storeId: 'store-chennai-main',
      storeName: 'Farmers Factory',
      etaMinutes: 45,
    });
  }
}
