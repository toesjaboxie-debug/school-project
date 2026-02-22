import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all files (everyone can see all files)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await db.file.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST - Create a new file (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, fileUrl, subject } = body;

    if (!title || !description || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const file = await db.file.create({
      data: {
        title,
        description,
        content,
        fileUrl: fileUrl || null,
        subject: subject || 'algemeen',
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Create file error:', error);
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 });
  }
}
