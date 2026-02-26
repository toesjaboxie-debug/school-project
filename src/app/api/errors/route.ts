import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get all error reports (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const errors = await db.errorReport.findMany({
      include: {
        reporter: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Report a new error (any logged in user)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { errorType, errorMessage, details } = body;

    if (!errorType || !errorMessage) {
      return NextResponse.json({ error: 'errorType en errorMessage vereist' }, { status: 400 });
    }

    await db.errorReport.create({
      data: {
        errorType,
        errorMessage,
        details: details || null,
        reporterId: user.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error report failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update error report status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { errorId, action } = body;

    if (!errorId || !action) {
      return NextResponse.json({ error: 'errorId en action vereist' }, { status: 400 });
    }

    const status = action === 'resolve' ? 'resolved' : 'ignored';

    await db.errorReport.update({
      where: { id: errorId },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
