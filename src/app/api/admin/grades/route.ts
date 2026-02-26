import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch ALL grades (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const grades = await db.grade.findMany({
      include: {
        student: { 
          select: { 
            id: true, 
            username: true,
            school: { select: { name: true } },
            class: { select: { name: true } }
          } 
        }
      },
      orderBy: { date: 'desc' },
      take: 500
    });

    return NextResponse.json({ grades });
  } catch (error: any) {
    console.error('Fetch admin grades error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch grades',
      exactError: error.message,
      details: error.stack
    }, { status: 500 });
  }
}
