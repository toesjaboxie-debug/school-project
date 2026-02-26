import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Find accounts by password (for username recovery)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        error: 'Wachtwoord moet minimaal 6 karakters zijn' 
      }, { status: 400 });
    }

    // Get all users (we need to check passwords)
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        password: true,
      }
    });

    // Check each user's password
    const matchingAccounts = [];
    for (const user of users) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        matchingAccounts.push({
          id: user.id,
          username: user.username,
        });
      }
    }

    // Limit results for security (don't expose too many accounts)
    const limitedAccounts = matchingAccounts.slice(0, 5);

    return NextResponse.json({ 
      accounts: limitedAccounts,
      count: limitedAccounts.length 
    });
  } catch (error: any) {
    console.error('Find username error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
