import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch support messages (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins can see all messages, users only see their own
    const messages = user.isAdmin 
      ? await db.supportMessage.findMany({
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : await db.supportMessage.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch support messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a support message/suggestion
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, type } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supportMessage = await db.supportMessage.create({
      data: {
        userId: user.id,
        message,
        type: type || 'suggestion',
      },
    });

    return NextResponse.json({ message: supportMessage });
  } catch (error) {
    console.error('Create support message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH - Update message status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedMessage = await db.supportMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update support message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
