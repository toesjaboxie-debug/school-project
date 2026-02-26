import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch agenda items (user's own + class public items)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const upcoming = searchParams.get('upcoming');

    try {
      // Build where clause - show user's own items OR all public items
      const where: any = {
        OR: [
          { userId: user.id }, // User's own items
          { isPublic: true } // All public items (visible to everyone)
        ]
      };

      if (type) where.OR = where.OR.map((condition: any) => ({ ...condition, type }));
      if (subject) where.OR = where.OR.map((condition: any) => ({ ...condition, subject }));
      if (upcoming === 'true') {
        where.OR = where.OR.map((condition: any) => ({ ...condition, testDate: { gte: new Date() } }));
      }

      const agendaItems = await db.agenda.findMany({
        where,
        include: {
          grades: {
            where: { studentId: user.id }
          }
        },
        orderBy: { testDate: 'asc' }
      });

      return NextResponse.json({ agendaItems });
    } catch (dbError: any) {
      console.error('Agenda query error:', dbError);
      return NextResponse.json({ agendaItems: [], error: 'Agenda tabel nog niet beschikbaar' });
    }
  } catch (error: any) {
    console.error('Agenda GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create agenda item (admin can create public for class)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, testDate, subject, type, weight, maxScore, isPublic, classId } = body;

    if (!title || !testDate || !subject) {
      return NextResponse.json({ error: 'Titel, datum en vak zijn vereist' }, { status: 400 });
    }

    // Only admin can create public items for a class
    const makePublic = isPublic && user.isAdmin && classId;

    try {
      const agendaItem = await db.agenda.create({
        data: {
          title,
          description: description || null,
          testDate: new Date(testDate),
          subject,
          type: type || 'toets',
          weight: weight || 1.0,
          maxScore: maxScore || 10.0,
          isPublic: makePublic,
          classId: makePublic ? classId : null,
          userId: user.id
        }
      });

      return NextResponse.json({ agendaItem });
    } catch (dbError: any) {
      console.error('Agenda create error:', dbError);
      return NextResponse.json({ 
        error: 'Kon agenda item niet aanmaken',
        details: dbError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Agenda POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update agenda item
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, testDate, subject, type, weight, maxScore, isCompleted, isPublic, classId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    // Check ownership
    const existing = await db.agenda.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Niet gevonden of geen toegang' }, { status: 404 });
    }

    const agendaItem = await db.agenda.update({
      where: { id },
      data: {
        title,
        description,
        testDate: testDate ? new Date(testDate) : undefined,
        subject,
        type,
        weight,
        maxScore,
        isCompleted,
        isPublic: user.isAdmin ? isPublic : undefined,
        classId: user.isAdmin ? classId : undefined
      }
    });

    return NextResponse.json({ agendaItem });
  } catch (error: any) {
    console.error('Agenda PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete agenda item
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    // Check ownership (or admin)
    const existing = await db.agenda.findUnique({ where: { id } });
    if (!existing || (existing.userId !== user.id && !user.isAdmin)) {
      return NextResponse.json({ error: 'Niet gevonden of geen toegang' }, { status: 404 });
    }

    await db.agenda.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Agenda DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
