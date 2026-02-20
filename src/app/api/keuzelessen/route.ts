import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch keuzelessen
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withStudents = searchParams.get('withStudents') === 'true';

    if (!db.keuzeles) {
      return NextResponse.json({ keuzelessen: [] });
    }

    const keuzelessen = await db.keuzeles.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: withStudents ? {
        students: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      } : undefined,
    });

    // Get user's selected keuzelessen
    let userKeuzelessen: string[] = [];
    if (db.userKeuzeles) {
      const selected = await db.userKeuzeles.findMany({
        where: { userId: user.id },
        select: { keuzelesId: true },
      });
      userKeuzelessen = selected.map(k => k.keuzelesId);
    }

    return NextResponse.json({ 
      keuzelessen,
      userKeuzelessen,
    });
  } catch (error) {
    console.error('Fetch keuzelessen error:', error);
    return NextResponse.json({ keuzelessen: [], userKeuzelessen: [] });
  }
}

// POST - Add keuzeles (admin only) OR user selects keuzeles
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a user selecting a keuzeles
    if (body.selectKeuzeles) {
      if (!db.userKeuzeles) {
        return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
      }

      const keuzelesId = body.selectKeuzeles;
      
      // Check if already selected
      const existing = await db.userKeuzeles.findUnique({
        where: { 
          userId_keuzelesId: { userId: user.id, keuzelesId }
        },
      });

      if (existing) {
        // Deselect
        await db.userKeuzeles.delete({
          where: { 
            userId_keuzelesId: { userId: user.id, keuzelesId }
          },
        });
        return NextResponse.json({ selected: false });
      } else {
        // Check max students
        if (db.keuzeles) {
          const keuzeles = await db.keuzeles.findUnique({
            where: { id: keuzelesId },
            include: { _count: { select: { students: true } } },
          });

          if (keuzeles && keuzeles._count.students >= keuzeles.maxStudents) {
            return NextResponse.json({ error: 'Deze keuzeles is vol' }, { status: 400 });
          }
        }

        // Select
        await db.userKeuzeles.create({
          data: { userId: user.id, keuzelesId },
        });
        return NextResponse.json({ selected: true });
      }
    }

    // Admin creates new keuzeles
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const { name, description, teacher, maxStudents, day, period } = body;

    if (!name) {
      return NextResponse.json({ error: 'Naam is vereist' }, { status: 400 });
    }

    if (!db.keuzeles) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const keuzeles = await db.keuzeles.create({
      data: {
        name,
        description: description || null,
        teacher: teacher || null,
        maxStudents: maxStudents || 30,
        day: day || null,
        period: period || null,
      },
    });

    return NextResponse.json({ keuzeles });
  } catch (error) {
    console.error('Create keuzeles error:', error);
    return NextResponse.json({ error: 'Kon keuzeles niet aanmaken' }, { status: 500 });
  }
}

// PUT - Update keuzeles (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, teacher, maxStudents, day, period, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    if (!db.keuzeles) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    const keuzeles = await db.keuzeles.update({
      where: { id },
      data: {
        name,
        description,
        teacher,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        day,
        period,
        isActive,
      },
    });

    return NextResponse.json({ keuzeles });
  } catch (error) {
    console.error('Update keuzeles error:', error);
    return NextResponse.json({ error: 'Kon keuzeles niet bijwerken' }, { status: 500 });
  }
}

// DELETE - Delete keuzeles (admin only)
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

    if (!db.keuzeles) {
      return NextResponse.json({ error: 'Database niet beschikbaar' }, { status: 500 });
    }

    await db.keuzeles.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete keuzeles error:', error);
    return NextResponse.json({ error: 'Kon keuzeles niet verwijderen' }, { status: 500 });
  }
}
