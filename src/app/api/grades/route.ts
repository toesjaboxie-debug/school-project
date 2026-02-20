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

// POST - Add a grade (admin for any student, students for themselves)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, subject, testName, grade, maxGrade, date, comment, isStudentAdded } = body;

    // Determine target student
    let targetStudentId: string;
    let studentAdded = false;

    if (user.isAdmin && studentId) {
      // Admin adding grade for another student
      targetStudentId = studentId;
    } else {
      // Student adding grade for themselves
      targetStudentId = user.id;
      studentAdded = true;
    }

    if (!subject || !testName || grade === undefined) {
      return NextResponse.json({ error: 'Vak, toetsnaam en cijfer zijn vereist' }, { status: 400 });
    }

    // Check if grade model exists
    if (!db.grade) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
    }

    // Verify student exists (for admin adding grades)
    if (user.isAdmin && studentId) {
      const student = await db.user.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return NextResponse.json({ error: 'Leerling niet gevonden' }, { status: 404 });
      }
    }

    const newGrade = await db.grade.create({
      data: {
        studentId: targetStudentId,
        subject,
        testName,
        grade: parseFloat(grade),
        maxGrade: maxGrade ? parseFloat(maxGrade) : 10.0,
        date: date ? new Date(date) : new Date(),
        comment,
        isStudentAdded: studentAdded,
      },
    });

    return NextResponse.json({ grade: newGrade });
  } catch (error) {
    console.error('Create grade error:', error);
    return NextResponse.json({ error: 'Kon cijfer niet opslaan' }, { status: 500 });
  }
}

// DELETE - Delete a grade
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is vereist' }, { status: 400 });
    }

    if (!db.grade) {
      return NextResponse.json({ error: 'Database tabel niet beschikbaar' }, { status: 500 });
    }

    // Find the grade
    const grade = await db.grade.findUnique({
      where: { id },
    });

    if (!grade) {
      return NextResponse.json({ error: 'Cijfer niet gevonden' }, { status: 404 });
    }

    // Check permissions: admin can delete any, users can only delete their own student-added grades
    if (!user.isAdmin && (grade.studentId !== user.id || !grade.isStudentAdded)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.grade.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete grade error:', error);
    return NextResponse.json({ error: 'Kon cijfer niet verwijderen' }, { status: 500 });
  }
}
