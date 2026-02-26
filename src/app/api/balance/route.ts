import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Request balance top-up
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, message } = body;

    if (!amount || amount < 1 || amount > 100) {
      return NextResponse.json({ error: 'Bedrag moet tussen €1 en €100 zijn' }, { status: 400 });
    }

    // Create a ProRequest for balance top-up
    const topUpRequest = await db.proRequest.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        message: message || `Saldo opwaardering €${amount}`,
        status: 'pending',
      }
    });

    return NextResponse.json({ 
      success: true, 
      request: topUpRequest,
      message: `Aanvraag voor €${amount} saldo is verzonden. De admin zal dit beoordelen.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get balance info
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        balance: true,
        hideBalance: true,
        isPro: true,
      }
    });

    // Get pending top-up requests
    const pendingRequests = await db.proRequest.count({
      where: {
        userId: user.id,
        status: 'pending'
      }
    });

    return NextResponse.json({
      balance: dbUser?.balance || 0,
      hideBalance: dbUser?.hideBalance ?? true,
      isPro: dbUser?.isPro || false,
      pendingRequests
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
