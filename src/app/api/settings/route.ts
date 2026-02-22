import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch site settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.siteSettings.findMany();
    
    // Convert to object
    const settingsObj: Record<string, string> = {};
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value;
    }

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Kon instellingen niet laden' }, { status: 500 });
  }
}

// POST - Update site settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Alleen admins' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key en value zijn vereist' }, { status: 400 });
    }

    // Upsert the setting
    const setting = await db.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json({ error: 'Kon instelling niet opslaan' }, { status: 500 });
  }
}
