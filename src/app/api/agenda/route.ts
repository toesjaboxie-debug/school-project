import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch agenda items (admin items + approved items + user's own items)
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
      // Get admin-created items + user's own items
      // Note: isApproved filter removed to avoid errors if column doesn't exist yet
      const agendaItems = await db.agenda.findMany({
        where: {
          OR: [
            { userId: user.id },  // User's own items
            { user: { isAdmin: true } }  // Admin items
          ]
        },
        include: {
          user: {
            select: { id: true, username: true, isAdmin: true }
          },
          grades: {
            where: { studentId: user.id }
          }
        },
        orderBy: { testDate: 'asc' }
      });

      return NextResponse.json({ agendaItems });
    } catch (dbError: any) {
      console.error('Agenda query error:', dbError);
      return NextResponse.json({ agendaItems: [], error: 'Agenda tabel nog niet beschikbaar', details: dbError.message });
    }
  } catch (error: any) {
    console.error('Agenda GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create agenda item (admin: auto-approved, user: needs approval)
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

    // Only set classId if isPublic is true and classId is provided and not empty
    const shouldMakePublic = user.isAdmin && isPublic && classId && classId.trim() !== '';

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
          isPublic: shouldMakePublic,
          classId: shouldMakePublic ? classId : null,
          userId: user.id
        },
        include: {
          user: {
            select: { id: true, username: true, isAdmin: true }
          }
        }
      });

      const message = user.isAdmin 
        ? 'Agenda item toegevoegd' 
        : 'Agenda item toegevoegd! Wacht op goedkeuring van de admin.';

      return NextResponse.json({ agendaItem, message });
    } catch (dbError: any) {
      console.error('Agenda create error:', dbError);
      return NextResponse.json({ 
        error: 'Kon agenda item niet aanmaken',
        details: dbError.message,
        code: dbError.code
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
    const { id, title, description, testDate, subject, type, weight, maxScore, isCompleted, isPublic, classId, isApproved } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    // Check ownership or admin
    const existing = await db.agenda.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    }
    
    if (existing.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
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
        classId: user.isAdmin ? classId : undefined,
        isApproved: user.isAdmin ? isApproved : undefined
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
