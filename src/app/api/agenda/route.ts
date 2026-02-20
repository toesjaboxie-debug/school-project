import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all agenda items (upcoming tests)
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if agenda model exists
    if (!db.agenda) {
      return NextResponse.json({ agenda: [] });
    }

    const agenda = await db.agenda.findMany({
      orderBy: { testDate: 'asc' },
    });

    return NextResponse.json({ agenda });
  } catch (error) {
    console.error('Fetch agenda error:', error);
    return NextResponse.json({ agenda: [] });
  }
}

// POST - Add agenda item (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, testDate, subject, type } = body;

    if (!title || !testDate || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if agenda model exists
    if (!db.agenda) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
    }

    const agendaItem = await db.agenda.create({
      data: {
        title,
        description,
        testDate: new Date(testDate),
        subject,
        type: type || 'toets',
      },
    });

    return NextResponse.json({ agenda: agendaItem });
  } catch (error) {
    console.error('Create agenda error:', error);
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 });
  }
}

// DELETE - Delete agenda item (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing agenda item ID' }, { status: 400 });
    }

    // Check if agenda model exists
    if (!db.agenda) {
      return NextResponse.json({ success: true });
    }

    await db.agenda.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete agenda error:', error);
    return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 });
  }
}
