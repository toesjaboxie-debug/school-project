import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// This endpoint creates the missing tables - call it ONCE after deployment
// DELETE THIS FILE after running it!

export async function GET() {
  try {
    // Test if TimeSlot table exists by trying to query it
    try {
      await db.timeSlot.findFirst();
    } catch (e: any) {
      if (e.code === 'P2021') {
        // Table doesn't exist - need to run migration
        return NextResponse.json({ 
          status: 'error',
          message: 'TimeSlot tabel bestaat niet. Voer uit in je lokale terminal met DATABASE_URL van productie:',
          command: 'npx prisma db push',
          note: 'Of ga naar Neon SQL Editor en voer de CREATE TABLE statements uit'
        });
      }
      throw e;
    }

    // Test Agenda table
    try {
      await db.agenda.findFirst();
    } catch (e: any) {
      if (e.code === 'P2021') {
        return NextResponse.json({ 
          status: 'error',
          message: 'Agenda tabel bestaat niet of heeft verkeerde kolommen.',
          command: 'npx prisma db push'
        });
      }
      throw e;
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Alle tabellen bestaan! Database is klaar.',
      tables: ['TimeSlot', 'Agenda', 'Grade']
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
}
