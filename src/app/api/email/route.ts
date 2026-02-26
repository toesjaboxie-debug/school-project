import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Send verification email (shows code on screen for demo)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Geen email adres opgegeven' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code and email
    await db.user.update({
      where: { id: user.id },
      data: {
        email: email,
        backupCodes: JSON.stringify({ code, expiresAt, type: 'email_verification' }),
      }
    });

    // For demo purposes, return the code directly
    // In production, you would send an actual email here
    return NextResponse.json({ 
      success: true, 
      message: 'Verificatiecode gegenereerd!',
      code, // Return code for demo
      note: 'Gebruik deze code om je email te verifiëren'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Verify email code
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is vereist' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.backupCodes) {
      return NextResponse.json({ error: 'Geen verificatie in behandeling' }, { status: 400 });
    }

    const stored = JSON.parse(dbUser.backupCodes);
    
    if (stored.code !== code) {
      return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 });
    }

    if (new Date(stored.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Code is verlopen' }, { status: 400 });
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        backupCodes: null,
      }
    });

    return NextResponse.json({ success: true, message: 'Email geverifieerd!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
