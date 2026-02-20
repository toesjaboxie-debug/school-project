import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch grades for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if grade model exists
    if (!db.grade) {
      return NextResponse.json({ grades: [] });
    }

    const grades = await db.grade.findMany({
      where: { studentId: user.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error('Fetch grades error:', error);
    return NextResponse.json({ grades: [] });
  }
}

// POST - Add a grade (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, subject, testName, grade, maxGrade, date, comment } = body;

    if (!studentId || !subject || !testName || grade === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if grade model exists
    if (!db.grade) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
    }

    // Verify student exists
    const student = await db.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const newGrade = await db.grade.create({
      data: {
        studentId,
        subject,
        testName,
        grade: parseFloat(grade),
        maxGrade: maxGrade ? parseFloat(maxGrade) : 10.0,
        date: date ? new Date(date) : new Date(),
        comment,
      },
    });

    return NextResponse.json({ grade: newGrade });
  } catch (error) {
    console.error('Create grade error:', error);
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}
