import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Default time slots - Hyperion Lyceum
const defaultSlots = [
  { period: 1, startTime: '09:00', endTime: '09:45' },
  { period: 2, startTime: '09:45', endTime: '10:30' },
  // Pauze 15 min
  { period: 3, startTime: '10:45', endTime: '11:30' },
  { period: 4, startTime: '11:30', endTime: '12:15' },
  // Pauze 30 min
  { period: 5, startTime: '12:45', endTime: '13:30' },
  { period: 6, startTime: '13:30', endTime: '14:15' },
  // Pauze 15 min
  { period: 7, startTime: '14:30', endTime: '15:15' },
  { period: 8, startTime: '15:15', endTime: '16:00' },
];

// GET - Fetch time slots for a school
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      // Return default slots if no school
      return NextResponse.json({ timeSlots: defaultSlots.map(s => ({ ...s, id: `default-${s.period}` })) });
    }

    try {
      let timeSlots = await db.timeSlot.findMany({
        where: { schoolId },
        orderBy: { period: 'asc' }
      });

      // Create default slots if none exist
      if (timeSlots.length === 0) {
        await db.timeSlot.createMany({
          data: defaultSlots.map(s => ({ ...s, schoolId }))
        });
        timeSlots = await db.timeSlot.findMany({
          where: { schoolId },
          orderBy: { period: 'asc' }
        });
      }

      return NextResponse.json({ timeSlots });
    } catch (dbError: any) {
      // If TimeSlot table doesn't exist, return defaults
      console.error('TimeSlot query error:', dbError);
      return NextResponse.json({ timeSlots: defaultSlots.map(s => ({ ...s, id: `default-${s.period}` })) });
    }
  } catch (error: any) {
    console.error('TimeSlot GET error:', error);
    const fallbackSlots = defaultSlots.map(s => ({ ...s, id: `default-${s.period}` }));
    return NextResponse.json({ timeSlots: fallbackSlots });
  }
}

// POST - Update time slots (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Geen toegang - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { schoolId, slots } = body;

    if (!schoolId || !slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: 'schoolId en slots zijn vereist' }, { status: 400 });
    }

    try {
      // Delete existing and create new
      await db.timeSlot.deleteMany({ where: { schoolId } });

      await db.timeSlot.createMany({
        data: slots.map((s: any) => ({
          period: s.period,
          startTime: s.startTime,
          endTime: s.endTime,
          schoolId
        }))
      });

      const timeSlots = await db.timeSlot.findMany({
        where: { schoolId },
        orderBy: { period: 'asc' }
      });

      return NextResponse.json({ success: true, timeSlots });
    } catch (dbError: any) {
      console.error('TimeSlot save error:', dbError);
      return NextResponse.json({ 
        error: 'Database fout. Mogelijk bestaat de TimeSlot tabel nog niet. Voer prisma db push uit.',
        details: dbError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('TimeSlot POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
