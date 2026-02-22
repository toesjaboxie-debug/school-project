import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    // Check if user already has Pro
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (dbUser?.isPro) {
      return NextResponse.json({ error: 'Je hebt al Pro!' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingRequest = await db.proRequest.findFirst({
      where: { userId: user.id, status: 'pending' }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Je hebt al een aanvraag ingediend' }, { status: 400 });
    }

    // Create pro request
    await db.proRequest.create({
      data: {
        userId: user.id,
        message: message || null,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, message: 'Aanvraag verstuurd!' });
  } catch (error: any) {
    console.error('Pro request error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden: ' + error.message }, { status: 500 });
  }
}
