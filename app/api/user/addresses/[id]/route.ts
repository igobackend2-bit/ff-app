import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/user/addresses/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      userId?: string; label?: string; line1?: string; line2?: string;
      landmark?: string; city?: string; state?: string; pincode?: string;
      lat?: number; lng?: number; isDefault?: boolean;
    };
    if (body.isDefault && body.userId) {
      await prisma.address.updateMany({ where: { userId: body.userId }, data: { isDefault: false } });
    }
    const addr = await prisma.address.update({
      where: { id },
      data: {
        ...(body.label     !== undefined && { label:     body.label }),
        ...(body.line1     !== undefined && { line1:     body.line1 }),
        ...(body.line2     !== undefined && { line2:     body.line2 }),
        ...(body.landmark  !== undefined && { landmark:  body.landmark }),
        ...(body.city      !== undefined && { city:      body.city }),
        ...(body.state     !== undefined && { state:     body.state }),
        ...(body.pincode   !== undefined && { pincode:   body.pincode }),
        ...(body.lat       !== undefined && { lat:       body.lat }),
        ...(body.lng       !== undefined && { lng:       body.lng }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });
    return NextResponse.json({ data: addr });
  } catch (err) {
    console.error('[addresses PATCH]', err);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/user/addresses/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[addresses DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
