import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all rooms (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const rooms = await db.room.findMany({
      include: {
        school: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ rooms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new room (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, building, capacity, schoolId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Naam is vereist' }, { status: 400 });
    }

    const room = await db.room.create({
      data: {
        name,
        building: building || null,
        capacity: capacity || 30,
        schoolId: schoolId || null,
      }
    });

    return NextResponse.json({ room });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a room (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, building, capacity, schoolId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    const room = await db.room.update({
      where: { id },
      data: {
        name,
        building,
        capacity,
        schoolId: schoolId || null,
      }
    });

    return NextResponse.json({ room });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a room (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    await db.room.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
