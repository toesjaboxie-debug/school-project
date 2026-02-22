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
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is vereist' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Ongeldig email formaat' }, { status: 400 });
    }

    // Check if email is already used by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        NOT: { id: user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Dit email adres is al in gebruik' }, { status: 400 });
    }

    // Update user email
    await db.user.update({
      where: { id: user.id },
      data: {
        email,
        emailVerified: false
      }
    });

    return NextResponse.json({ success: true, message: 'Email opgeslagen' });
  } catch (error: any) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Er is een fout opgetreden: ' + error.message }, { status: 500 });
  }
}
