import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is vereist' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findFirst({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await db.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await db.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, you would send an email here
    // For now, we just return success and log the token
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset URL: ${process.env.NEXT_PUBLIC_URL || 'https://hyperionedulearn.vercel.app'}/reset-password?token=${token}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
