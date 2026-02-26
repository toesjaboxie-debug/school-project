import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get all pro requests (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const requests = await db.proRequest.findMany({
      include: {
        user: { select: { username: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      exactError: error.stack
    }, { status: 500 });
  }
}

// PUT - Approve or reject a pro request (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId en action vereist' }, { status: 400 });
    }

    const proRequest = await db.proRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!proRequest) {
      return NextResponse.json({ error: 'Aanvraag niet gevonden' }, { status: 404 });
    }

    if (action === 'approve') {
      // Add balance to user
      await db.user.update({
        where: { id: proRequest.userId },
        data: {
          balance: { increment: proRequest.amount }
        }
      });

      // Update request status
      await db.proRequest.update({
        where: { id: requestId },
        data: { status: 'approved' }
      });

      return NextResponse.json({ 
        success: true, 
        message: `€${proRequest.amount} toegevoegd aan ${proRequest.user.username}` 
      });
    } else if (action === 'reject') {
      await db.proRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      });

      return NextResponse.json({ success: true, message: 'Aanvraag afgewezen' });
    }

    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      exactError: error.stack
    }, { status: 500 });
  }
}
