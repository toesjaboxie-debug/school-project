import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch ONLY the current user's grades (private!)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // EVERYONE (including admins) only sees their own grades here
    // Admins can view all grades via /api/admin/grades
    const grades = await db.grade.findMany({
      where: { studentId: user.id },
      orderBy: { date: 'desc' },
      include: {
        agenda: {
          select: {
            id: true,
            title: true,
            type: true,
            weight: true
          }
        }
      }
    });

    return NextResponse.json({ grades });
  } catch (error: any) {
    console.error('Fetch grades error:', error);
    return NextResponse.json({
      error: 'Failed to fetch grades',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// POST - Add a grade (students can add their own, admin can add for anyone)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { studentId, subject, testName, grade, maxGrade, weight, date, comment, agendaId } = body;

    // If no studentId provided, use current user's ID
    if (!studentId) {
      studentId = user.id;
    }

    // Students can only add their own grades (override any attempt to set different studentId)
    if (!user.isAdmin) {
      studentId = user.id;
    }

    // Validate required fields
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Vak is verplicht' }, { status: 400 });
    }
    if (!testName || !testName.trim()) {
      return NextResponse.json({ error: 'Toets naam is verplicht' }, { status: 400 });
    }
    if (grade === undefined || grade === null || grade === '' || isNaN(parseFloat(grade))) {
      return NextResponse.json({ error: 'Cijfer is verplicht' }, { status: 400 });
    }

    // Verify student exists
    const student = await db.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If agendaId provided, get weight and maxScore from agenda
    let finalWeight = weight ? parseFloat(weight) : 1.0;
    let finalMaxGrade = maxGrade ? parseFloat(maxGrade) : 10.0;

    if (agendaId) {
      const agendaItem = await db.agenda.findUnique({
        where: { id: agendaId }
      });
      if (agendaItem) {
        finalWeight = agendaItem.weight;
        finalMaxGrade = agendaItem.maxScore;
        // Mark agenda as completed
        await db.agenda.update({
          where: { id: agendaId },
          data: { isCompleted: true }
        });
      }
    }

    const newGrade = await db.grade.create({
      data: {
        studentId,
        subject,
        testName,
        grade: parseFloat(grade),
        maxGrade: finalMaxGrade,
        weight: finalWeight,
        date: date ? new Date(date) : new Date(),
        comment,
        agendaId: agendaId || null,
        isStudentAdded: !user.isAdmin, // Mark if added by student
      },
      include: {
        student: { select: { id: true, username: true } },
        agenda: { select: { id: true, title: true, type: true, weight: true } }
      }
    });

    return NextResponse.json({ grade: newGrade });
  } catch (error: any) {
    console.error('Create grade error:', error);
    return NextResponse.json({
      error: 'Failed to create grade',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// PUT - Update a grade (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { gradeId, subject, testName, grade, maxGrade, weight, comment } = body;

    if (!gradeId) {
      return NextResponse.json({ error: 'gradeId is required' }, { status: 400 });
    }

    const existingGrade = await db.grade.findUnique({
      where: { id: gradeId }
    });

    if (!existingGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (subject) updateData.subject = subject;
    if (testName) updateData.testName = testName;
    if (grade !== undefined) updateData.grade = parseFloat(grade);
    if (maxGrade !== undefined) updateData.maxGrade = parseFloat(maxGrade);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (comment !== undefined) updateData.comment = comment;

    const updatedGrade = await db.grade.update({
      where: { id: gradeId },
      data: updateData,
      include: {
        student: { select: { id: true, username: true } },
        agenda: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json({ grade: updatedGrade });
  } catch (error: any) {
    console.error('Update grade error:', error);
    return NextResponse.json({
      error: 'Failed to update grade',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

// DELETE - Delete a grade (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.grade.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete grade error:', error);
    return NextResponse.json({
      error: 'Failed to delete grade',
      exactError: error.message
    }, { status: 500 });
  }
}
