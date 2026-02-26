import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch schedule (all users can view)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const week = searchParams.get('week') || '1';

    // Build where clause
    const where: any = {
      week: parseInt(week)
    };

    // If classId is provided, filter by it
    // If classId is empty string or null, show lessons without a class (general lessons)
    if (classId && classId !== 'null') {
      where.classId = classId;
    }

    // Get the main schedule
    const schedule = await db.schedule.findMany({
      where,
      include: {
        teacher: { select: { name: true } },
        room: { select: { name: true } }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error('Schedule GET error:', error);
    return NextResponse.json({ error: error.message, schedule: [] }, { status: 500 });
  }
}

// POST - Add lesson to schedule (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { day, period, subject, teacherId, roomId, classId, startTime, endTime, week, isKeuzeles } = body;

    if (!day || period === undefined || !subject) {
      return NextResponse.json({ error: 'Dag, uur en vak zijn vereist' }, { status: 400 });
    }

    const lesson = await db.schedule.create({
      data: {
        day,
        period: parseInt(period),
        subject,
        teacherId: teacherId || null,
        roomId: roomId || null,
        classId: classId || null,
        startTime: startTime || '09:00',
        endTime: endTime || '09:45',
        week: parseInt(week) || 1,
        isKeuzeles: isKeuzeles || false,
      },
      include: {
        teacher: { select: { name: true } },
        room: { select: { name: true } }
      }
    });

    return NextResponse.json({ lesson });
  } catch (error: any) {
    console.error('Schedule POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update lesson (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, day, period, subject, teacherId, roomId, classId, startTime, endTime, week, isKeuzeles } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    const lesson = await db.schedule.update({
      where: { id },
      data: {
        day,
        period: period !== undefined ? parseInt(period) : undefined,
        subject,
        teacherId: teacherId || null,
        roomId: roomId || null,
        classId: classId || null,
        startTime,
        endTime,
        week: week !== undefined ? parseInt(week) : undefined,
        isKeuzeles,
      },
      include: {
        teacher: { select: { name: true } },
        room: { select: { name: true } }
      }
    });

    return NextResponse.json({ lesson });
  } catch (error: any) {
    console.error('Schedule PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete lesson (admin only)
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

    await db.schedule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Schedule DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
