import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Create admin account (only works if no admin exists yet, or with secret key)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, secretKey } = body;

    // Security: require a secret key or check if no admin exists
    const existingAdmin = await db.user.findFirst({ where: { isAdmin: true } });
    
    if (existingAdmin && secretKey !== 'EduLearn2024AdminSecret') {
      return NextResponse.json({ 
        error: 'Admin bestaat al. Gebruik de secret key om een nieuwe te maken.',
        hint: 'Voeg secretKey: "EduLearn2024AdminSecret" toe aan je request'
      }, { status: 403 });
    }

    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam en wachtwoord zijn vereist' 
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam bestaat al' 
      }, { status: 400 });
    }

    // Hash password and create admin
    const hashedPassword = await hashPassword(password);
    
    const admin = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: true,
        isPro: true,
        onboardingDone: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account aangemaakt!',
      user: {
        id: admin.id,
        username: admin.username,
        isAdmin: admin.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ 
      error: 'Fout bij aanmaken admin', 
      details: error.message 
    }, { status: 500 });
  }
}
