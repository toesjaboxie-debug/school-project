import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch bug reports (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const bugReports = await db.bugReport.findMany({
      include: {
        user: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bugReports });
  } catch (error) {
    console.error('Fetch bug reports error:', error);
    return NextResponse.json({ error: 'Kon bug reports niet laden' }, { status: 500 });
  }
}

// POST - Create a bug report (anyone)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { title, description, priority, reporterName } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Titel en beschrijving zijn vereist' }, { status: 400 });
    }

    const bugReport = await db.bugReport.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        reporterName: reporterName || null,
        userId: user?.id || null,
      },
    });

    return NextResponse.json({ bugReport });
  } catch (error) {
    console.error('Create bug report error:', error);
    return NextResponse.json({ error: 'Kon bug report niet aanmaken' }, { status: 500 });
  }
}

// PATCH - Update bug report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    const bugReport = await db.bugReport.update({
      where: { id },
      data: {
        status: status || undefined,
        priority: priority || undefined,
      },
    });

    return NextResponse.json({ bugReport });
  } catch (error) {
    console.error('Update bug report error:', error);
    return NextResponse.json({ error: 'Kon bug report niet bijwerken' }, { status: 500 });
  }
}

// DELETE - Delete bug report (admin only)
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

    await db.bugReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bug report error:', error);
    return NextResponse.json({ error: 'Kon bug report niet verwijderen' }, { status: 500 });
  }
}
