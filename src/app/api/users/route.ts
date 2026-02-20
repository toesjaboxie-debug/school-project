import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch all users (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Check if user model exists (it should, since we can authenticate)
    if (!db.user) {
      return NextResponse.json({ users: [] });
    }

    // Check if grade model exists for counting
    const hasGradeModel = !!db.grade;
    const hasSupportMessageModel = !!db.supportMessage;

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        ...(hasGradeModel || hasSupportMessageModel ? {
          _count: {
            select: {
              ...(hasGradeModel ? { grades: true } : {}),
              ...(hasSupportMessageModel ? { supportMessages: true } : {}),
            },
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform users to ensure _count exists
    const transformedUsers = users.map(u => ({
      ...u,
      _count: u._count || { grades: 0, supportMessages: 0 },
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ users: [] });
  }
}
