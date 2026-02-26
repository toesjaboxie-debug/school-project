import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        isPro: true,
        balance: true,
        email: true,
        emailVerified: true,
        onboardingDone: true,
        schoolId: true,
        classId: true,
        school: { select: { name: true } },
        class: { select: { name: true } },
      }
    });

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
