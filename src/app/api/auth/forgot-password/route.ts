import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// POST - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Gebruikersnaam is vereist' }, { status: 400 });
    }

    // Find user by username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: username, mode: 'insensitive' } }
        ]
      },
      select: { id: true, username: true, email: true }
    });

    // Always return success to prevent username enumeration
    if (!user || !user.email) {
      return NextResponse.json({ 
        message: 'Als het account bestaat en een e-mailadres heeft, ontvang je een reset link.' 
      });
    }

    // Delete any existing reset tokens for this user
    await db.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Create new reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Send password reset email
    await sendEmail(user.email, 'reset-password', { token, username: user.username });

    return NextResponse.json({ 
      message: 'Als het account bestaat en een e-mailadres heeft, ontvang je een reset link.' 
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
