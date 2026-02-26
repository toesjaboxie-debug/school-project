import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get schools, classes, keuzelessen for onboarding
export async function GET() {
  try {
    const schools = await db.school.findMany({
      include: { classes: { where: { isActive: true } } },
      where: { isActive: true }
    });

    const keuzelessen = await db.keuzeles.findMany({
      where: { isActive: true, isApproved: true }
    });

    return NextResponse.json({ schools, keuzelessen });
  } catch (error: any) {
    return NextResponse.json({ schools: [], keuzelessen: [], error: error.message }, { status: 200 });
  }
}

// POST - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    
    // Skip mode - just mark as done
    if (body.skip) {
      await db.user.update({
        where: { id: user.id },
        data: { onboardingDone: true }
      });
      return NextResponse.json({ success: true });
    }

    const { schoolId, classId, keuzelessen, grades, email, emailCode, enable2FA } = body;

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: {
        onboardingDone: true,
        schoolId: schoolId || null,
        classId: classId || null,
        email: email || undefined,
        emailVerified: !!emailCode,
      }
    });

    // Add grades
    if (grades?.length > 0) {
      for (const g of grades) {
        if (g.subject && g.grade) {
          try {
            await db.grade.create({
              data: {
                subject: g.subject,
                testName: g.testName || 'Onbekend',
                grade: parseFloat(g.grade),
                studentId: user.id,
                isStudentAdded: true,
              }
            });
          } catch {}
        }
      }
    }

    // Enroll in keuzelessen
    if (keuzelessen?.length > 0) {
      for (const keuzelesId of keuzelessen) {
        try {
          await db.userKeuzeles.create({
            data: { userId: user.id, keuzelesId }
          });
        } catch {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
