import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all teachers (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const teachers = await db.teacher.findMany({
      include: {
        school: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ teachers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new teacher (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, subjects, schoolId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Naam is vereist' }, { status: 400 });
    }

    const teacher = await db.teacher.create({
      data: {
        name,
        email: email || null,
        subjects: subjects || null,
        schoolId: schoolId || null,
      }
    });

    return NextResponse.json({ teacher });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a teacher (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, subjects, schoolId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    const teacher = await db.teacher.update({
      where: { id },
      data: {
        name,
        email,
        subjects,
        schoolId: schoolId || null,
      }
    });

    return NextResponse.json({ teacher });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a teacher (admin only)
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

    await db.teacher.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
