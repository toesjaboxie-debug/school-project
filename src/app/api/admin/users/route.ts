import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get user details (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return all users summary
      const users = await db.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isAdmin: true,
          isPro: true,
          balance: true,
          createdAt: true,
          _count: {
            select: {
              grades: true,
              chatHistories: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ users });
    }

    // Get specific user details
    const userDetails = await db.user.findUnique({
      where: { id: userId },
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
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!userDetails) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Get grades
    const grades = await db.grade.findMany({
      where: { studentId: userId },
      orderBy: { date: 'desc' },
      take: 50
    });

    // Get schedule
    const schedule = await db.userSchedule.findMany({
      where: { userId },
      orderBy: [{ week: 'asc' }, { period: 'asc' }]
    });

    // Get chat history
    const chatHistory = await db.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Parse chat messages
    const parsedChats = chatHistory.map(chat => ({
      ...chat,
      messages: (() => {
        try {
          return JSON.parse(chat.messages);
        } catch {
          return [];
        }
      })()
    }));

    // Get Pro requests
    const proRequests = await db.proRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      user: userDetails,
      grades,
      schedule,
      chatHistory: parsedChats,
      proRequests
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update user (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isPro, balance, isAdmin } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId vereist' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isPro === 'boolean') updateData.isPro = isPro;
    if (typeof balance === 'number') updateData.balance = balance;
    if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        isPro: true,
        balance: true,
        isAdmin: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId vereist' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Kan je eigen account niet verwijderen' }, { status: 400 });
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
