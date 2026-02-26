import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET a single file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const file = await db.file.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van het bestand' },
      { status: 500 }
    );
  }
}

// PUT update a file (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Alleen admins kunnen bestanden bijwerken' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, content, fileUrl, subject } = body;

    const existingFile = await db.file.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
    }

    const file = await db.file.update({
      where: { id },
      data: {
        title: title ?? existingFile.title,
        description: description ?? existingFile.description,
        content: content ?? existingFile.content,
        fileUrl: fileUrl !== undefined ? fileUrl : existingFile.fileUrl,
        subject: subject ?? existingFile.subject,
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
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van het bestand' },
      { status: 500 }
    );
  }
}

// DELETE a file (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Alleen admins kunnen bestanden verwijderen' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingFile = await db.file.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
    }

    await db.file.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Bestand succesvol verwijderd' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van het bestand' },
      { status: 500 }
    );
  }
}
