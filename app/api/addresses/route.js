import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/addresses — list user addresses
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses — add new address
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    const { fullName, phone, street, city, state, zip, country, isDefault } = data;

    if (!fullName || !phone || !street || !city || !state || !zip) {
      return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { fullName, phone, street, city, state, zip, country: country || 'US', isDefault: !!isDefault, userId: session.user.id },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}

// PUT /api/addresses — update address
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

    // Ensure address belongs to user
    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({ where: { id }, data });
    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/addresses — delete address
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
