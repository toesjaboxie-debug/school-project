import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Default subjects for fallback
const defaultSubjects = [
  { id: '1', name: 'wiskunde', displayName: 'Wiskunde', icon: '📐', color: '#3B82F6' },
  { id: '2', name: 'engels', displayName: 'Engels', icon: '🇬🇧', color: '#10B981' },
  { id: '3', name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱', color: '#F59E0B' },
  { id: '4', name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜', color: '#8B5CF6' },
  { id: '5', name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍', color: '#06B6D4' },
  { id: '6', name: 'biologie', displayName: 'Biologie', icon: '🧬', color: '#22C55E' },
  { id: '7', name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️', color: '#EF4444' },
  { id: '8', name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪', color: '#F97316' },
  { id: '9', name: 'frans', displayName: 'Frans', icon: '🇫🇷', color: '#EC4899' },
  { id: '10', name: 'duits', displayName: 'Duits', icon: '🇩🇪', color: '#6366F1' },
  { id: '11', name: 'economie', displayName: 'Economie', icon: '📊', color: '#14B8A6' },
  { id: '12', name: 'algemeen', displayName: 'Algemeen', icon: '📚', color: '#6B7280' },
];

// GET - Fetch all subjects
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to fetch from database, but return defaults if table doesn't exist
    try {
      if (db.subject) {
        const subjects = await db.subject.findMany({
          orderBy: { name: 'asc' },
        });
        
        if (subjects && subjects.length > 0) {
          return NextResponse.json({ subjects });
        }
      }
    } catch (dbError) {
      console.log('Subjects table not available, using defaults');
    }

    // Return default subjects
    return NextResponse.json({ subjects: defaultSubjects });
  } catch (error) {
    console.error('Fetch subjects error:', error);
    return NextResponse.json({ subjects: defaultSubjects });
  }
}

// POST - Add a new subject (admin only)
export async function POST(request: Request) {
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

    if (!db.subject) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
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
export async function PUT(request: Request) {
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

    if (!db.subject) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
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
export async function DELETE(request: Request) {
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

    if (!db.subject) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
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
