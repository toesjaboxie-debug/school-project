import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];

// GET - Fetch schedule
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db.schedule) {
      return NextResponse.json({ schedule: [] });
    }

    const schedule = await db.schedule.findMany({
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
      ],
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Fetch schedule error:', error);
    return NextResponse.json({ schedule: [] });
  }
}

// POST - Add schedule item (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { day, period, subject, room, teacher, startTime, endTime } = body;

    if (!day || !period || !subject) {
      return NextResponse.json({ error: 'Dag, periode en vak zijn vereist' }, { status: 400 });
    }

    if (!db.schedule) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const item = await db.schedule.create({
      data: {
        day: day.toLowerCase(),
        period: parseInt(period),
        subject,
        room: room || null,
        teacher: teacher || null,
        startTime: startTime || '08:30',
        endTime: endTime || '09:20',
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json({ error: 'Kon rooster item niet aanmaken' }, { status: 500 });
  }
}

// PUT - Update schedule item (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { id, day, period, subject, room, teacher, startTime, endTime } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    if (!db.schedule) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const item = await db.schedule.update({
      where: { id },
      data: {
        day: day?.toLowerCase(),
        period: period ? parseInt(period) : undefined,
        subject,
        room,
        teacher,
        startTime,
        endTime,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json({ error: 'Kon rooster item niet bijwerken' }, { status: 500 });
  }
}

// DELETE - Delete schedule item (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    if (!db.schedule) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    await db.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: 'Kon rooster item niet verwijderen' }, { status: 500 });
  }
}
