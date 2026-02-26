import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

// POST - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token en wachtwoord zijn vereist' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 karakters lang zijn' }, { status: 400 });
    }

    // Find reset token
    const resetToken = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Ongeldige token' }, { status: 400 });
    }

    // Check if token expired
    if (resetToken.expiresAt < new Date()) {
      await db.passwordReset.delete({ where: { token } });
      return NextResponse.json({ error: 'Token is verlopen' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Delete the reset token
    await db.passwordReset.delete({ where: { token } });

    return NextResponse.json({ 
      success: true, 
      message: 'Wachtwoord succesvol gewijzigd!'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Geen token opgegeven' }, { status: 400 });
    }

    const resetToken = await db.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { username: true } } }
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Ongeldige token' });
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordReset.delete({ where: { token } });
      return NextResponse.json({ valid: false, error: 'Token is verlopen' });
    }

    return NextResponse.json({ 
      valid: true, 
      username: resetToken.user.username 
    });
  } catch (error: any) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
