import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch pending items for approval
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending agenda items (not from admins)
    const pendingAgenda = await db.agenda.findMany({
      where: {
        isApproved: false,
        user: { isAdmin: false }
      },
      include: {
        user: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get pending files (not from admins)
    const pendingFiles = await db.file.findMany({
      where: {
        isApproved: false,
        author: { isAdmin: false }
      },
      include: {
        author: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      agenda: pendingAgenda,
      files: pendingFiles
    });
  } catch (error: any) {
    console.error('Fetch pending items error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Approve or reject an item
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, action } = body; // type: 'agenda' | 'file', action: 'approve' | 'reject'

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (type === 'agenda') {
      if (action === 'approve') {
        await db.agenda.update({
          where: { id },
          data: { isApproved: true }
        });
      } else {
        await db.agenda.delete({ where: { id } });
      }
    } else if (type === 'file') {
      if (action === 'approve') {
        await db.file.update({
          where: { id },
          data: { isApproved: true }
        });
      } else {
        await db.file.delete({ where: { id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approval action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
