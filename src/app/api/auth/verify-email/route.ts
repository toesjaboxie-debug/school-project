import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// POST - Send verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, username } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Gebruiker ID en e-mail zijn vereist' }, { status: 400 });
    }

    // Check if already verified
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'E-mail is al geverifieerd' });
    }

    // Delete any existing verification tokens for this user
    await db.emailVerification.deleteMany({
      where: { userId }
    });

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.emailVerification.create({
      data: {
        token,
        email,
        userId,
        expiresAt
      }
    });

    // Send verification email
    const result = await sendEmail(email, 'verify-email', { token, username: username || 'gebruiker' });

    if (!result.success) {
      return NextResponse.json({ error: 'Kon e-mail niet versturen', details: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verificatie e-mail verstuurd!' });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Geen token opgegeven' }, { status: 400 });
    }

    // Find verification token
    const verification = await db.emailVerification.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verification) {
      return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 });
    }

    // Check if token expired
    if (verification.expiresAt < new Date()) {
      await db.emailVerification.delete({ where: { token } });
      return NextResponse.json({ error: 'Token is verlopen' }, { status: 400 });
    }

    // Update user - set email verified and update email if changed
    await db.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
        email: verification.email
      }
    });

    // Delete the verification token
    await db.emailVerification.delete({ where: { token } });

    // Send welcome email
    await sendEmail(verification.email, 'welcome', { username: verification.user.username });

    return NextResponse.json({ 
      success: true, 
      message: 'E-mail succesvol geverifieerd!',
      username: verification.user.username
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
