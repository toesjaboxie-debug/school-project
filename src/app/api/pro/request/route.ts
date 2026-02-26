import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Create a new pro/balance request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { message, amount } = body;

    // Check if user already has Pro
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (dbUser?.isPro && !amount) {
      return NextResponse.json({ error: 'Je hebt al Pro!' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingRequest = await db.proRequest.findFirst({
      where: { userId: user.id, status: 'pending' }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Je hebt al een aanvraag ingediend' }, { status: 400 });
    }

    // Create request
    await db.proRequest.create({
      data: {
        userId: user.id,
        message: message || null,
        amount: amount || 5.0,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, message: 'Aanvraag verstuurd!' });
  } catch (error: any) {
    console.error('Pro request error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden: ' + error.message }, { status: 500 });
  }
}

// GET - Get all pro requests (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const requests = await db.proRequest.findMany({
      include: {
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Approve or reject a request (admin only)
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
          balance: { increment: proRequest.amount },
          isPro: proRequest.amount >= 5 // Auto-pro for €5+
        }
      });
      
      await db.proRequest.update({
        where: { id: requestId },
        data: { status: 'approved' }
      });
    } else if (action === 'reject') {
      await db.proRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
