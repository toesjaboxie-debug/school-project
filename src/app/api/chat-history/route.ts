import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch chat history for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('id');

    if (!db.chatHistory) {
      return NextResponse.json({ histories: [] });
    }

    if (chatId) {
      const history = await db.chatHistory.findUnique({
        where: { id: chatId },
      });

      if (!history || history.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      return NextResponse.json({ history });
    }

    const histories = await db.chatHistory.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ histories });
  } catch (error) {
    console.error('Fetch chat history error:', error);
    return NextResponse.json({ histories: [] });
  }
}

// POST - Save chat history
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, subject, model, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    if (!db.chatHistory) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    let history;

    if (id) {
      // Update existing
      history = await db.chatHistory.update({
        where: { id, userId: user.id },
        data: {
          subject: subject || null,
          model: model || 'glm-4.5-air:free',
          messages: JSON.stringify(messages),
        },
      });
    } else {
      // Create new
      history = await db.chatHistory.create({
        data: {
          userId: user.id,
          subject: subject || null,
          model: model || 'glm-4.5-air:free',
          messages: JSON.stringify(messages),
        },
      });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Save chat history error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE - Delete chat history
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (!db.chatHistory) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    await db.chatHistory.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chat history error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
