import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get user settings
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        isPro: true,
        balance: true,
        hideBalance: true,
        darkMode: true,
        notifications: true,
        language: true,
        schoolId: true,
        classId: true,
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, school: { select: { id: true, name: true } } } },
        createdAt: true,
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      exactError: error.stack 
    }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { hideBalance, darkMode, notifications, language, schoolId, classId } = body;

    const updateData: any = {};
    if (typeof hideBalance === 'boolean') updateData.hideBalance = hideBalance;
    if (typeof darkMode === 'boolean') updateData.darkMode = darkMode;
    if (typeof notifications === 'boolean') updateData.notifications = notifications;
    if (language) updateData.language = language;
    
    // Allow setting school and class to null (empty string becomes null)
    if (schoolId !== undefined) {
      updateData.schoolId = schoolId || null;
    }
    if (classId !== undefined) {
      updateData.classId = classId || null;
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        isPro: true,
        balance: true,
        hideBalance: true,
        darkMode: true,
        notifications: true,
        language: true,
        schoolId: true,
        classId: true,
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, school: { select: { id: true, name: true } } } },
      }
    });

    return NextResponse.json({ user: updatedUser, message: 'Instellingen opgeslagen' });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      exactError: error.stack 
    }, { status: 500 });
  }
}
