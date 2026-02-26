import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch files (admin files + approved files + user's own files)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await db.file.findMany({
      where: {
        OR: [
          // Admin files are always visible
          { author: { isAdmin: true } },
          // Approved files from any user
          { isApproved: true },
          // User's own files (even if not approved yet)
          { authorId: user.id }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            isAdmin: true
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Fetch files error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch files',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// POST - Create a new file (admin: auto-approved, user: needs approval)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, fileUrl, subject } = body;

    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Titel en inhoud zijn vereist',
        exactError: `Missing fields: title=${!!title}, content=${!!content}`
      }, { status: 400 });
    }

    // Admin files are auto-approved, user files need approval
    const isApproved = user.isAdmin;

    const file = await db.file.create({
      data: {
        title,
        description: description || '',
        content,
        fileUrl: fileUrl || null,
        subject: subject || 'algemeen',
        isApproved,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            isAdmin: true
          },
        },
      },
    });

    const message = user.isAdmin 
      ? 'Materiaal toegevoegd' 
      : 'Materiaal toegevoegd! Wacht op goedkeuring van de admin.';

    return NextResponse.json({ file, success: true, message });
  } catch (error: any) {
    console.error('Create file error:', error);
    return NextResponse.json({ 
      error: 'Failed to create file',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
