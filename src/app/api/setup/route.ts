import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Simple protection - require a secret
    if (secret !== 'TOESJABLOX_RESET_2024') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    // Create or update admin user
    const hashedPassword = await bcrypt.hash('TOESJABLOX', 10);
    
    const existingAdmin = await db.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      await db.user.update({
        where: { username: 'admin' },
        data: { 
          password: hashedPassword,
          isAdmin: true,
        },
      });
    } else {
      await db.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          isAdmin: true,
        },
      });
    }

    // Create subjects if they don't exist
    const subjects = [
      { name: 'wiskunde', displayName: 'Wiskunde', icon: '📐', color: '#3B82F6' },
      { name: 'engels', displayName: 'Engels', icon: '🇬🇧', color: '#10B981' },
      { name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱', color: '#F59E0B' },
      { name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜', color: '#8B5CF6' },
      { name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍', color: '#06B6D4' },
      { name: 'biologie', displayName: 'Biologie', icon: '🧬', color: '#22C55E' },
      { name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️', color: '#EF4444' },
      { name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪', color: '#F97316' },
      { name: 'frans', displayName: 'Frans', icon: '🇫🇷', color: '#EC4899' },
      { name: 'duits', displayName: 'Duits', icon: '🇩🇪', color: '#6366F1' },
      { name: 'economie', displayName: 'Economie', icon: '📊', color: '#14B8A6' },
      { name: 'maatschappijleer', displayName: 'Maatschappijleer', icon: '🏛️', color: '#A855F7' },
      { name: 'algemeen', displayName: 'Algemeen', icon: '📚', color: '#6B7280' },
    ];

    for (const subject of subjects) {
      await db.subject.upsert({
        where: { name: subject.name },
        update: {
          displayName: subject.displayName,
          icon: subject.icon,
          color: subject.color,
        },
        create: {
          name: subject.name,
          displayName: subject.displayName,
          icon: subject.icon,
          color: subject.color,
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin user created/updated with password: TOESJABLOX',
      adminUsername: 'admin',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
