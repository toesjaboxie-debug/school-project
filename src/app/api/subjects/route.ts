import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all subjects
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjects = await db.subject.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Fetch subjects error:', error);
    return NextResponse.json({ error: 'Kon vakken niet laden' }, { status: 500 });
  }
}

// POST - Add a new subject (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { name, displayName, icon, color } = body;

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Naam en weergavenaam zijn vereist' }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        displayName,
        icon: icon || '📚',
        color: color || '#6B7280',
      },
    });

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Kon vak niet aanmaken' }, { status: 500 });
  }
}

// PUT - Update a subject (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, displayName, icon, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    const subject = await db.subject.update({
      where: { id },
      data: {
        name: name ? name.toLowerCase().replace(/\s+/g, '-') : undefined,
        displayName,
        icon,
        color,
      },
    });

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json({ error: 'Kon vak niet bijwerken' }, { status: 500 });
  }
}

// DELETE - Delete a subject (admin only)
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

    await db.subject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json({ error: 'Kon vak niet verwijderen' }, { status: 500 });
  }
}
