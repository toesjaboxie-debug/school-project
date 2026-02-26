import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, twoFactorCode } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Gebruikersnaam en wachtwoord zijn vereist' },
        { status: 400 }
      );
    }

    // Test database connection
    try {
      await db.$connect();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database verbinding mislukt', exactError: dbError.message },
        { status: 500 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Ongeldige gebruikersnaam of wachtwoord' },
        { status: 401 }
      );
    }

    // Check if user has 2FA enabled
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    
    if (dbUser?.backupCodes) {
      try {
        const stored = JSON.parse(dbUser.backupCodes);
        
        if (stored.twoFactorEnabled && stored.secret) {
          // User has 2FA enabled
          if (!twoFactorCode) {
            // Return that 2FA is required
            return NextResponse.json({
              require2FA: true,
              message: 'Voer je 2FA code in',
              userId: user.id
            });
          }
          
          // Verify 2FA code
          const isValid = await verifyTOTP(twoFactorCode, stored.secret);
          const isBackupCode = stored.backupCodes?.includes(twoFactorCode?.toUpperCase());
          
          if (!isValid && !isBackupCode) {
            return NextResponse.json(
              { error: 'Ongeldige 2FA code', require2FA: true },
              { status: 400 }
            );
          }
          
          // Remove used backup code if applicable
          if (isBackupCode) {
            const updatedBackupCodes = stored.backupCodes.filter((c: string) => c !== twoFactorCode.toUpperCase());
            await db.user.update({
              where: { id: user.id },
              data: {
                backupCodes: JSON.stringify({
                  ...stored,
                  backupCodes: updatedBackupCodes
                })
              }
            });
          }
        }
      } catch (e) {
        // If parsing fails, assume no valid 2FA setup
      }
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        isPro: user.isPro,
        balance: user.balance,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het inloggen', exactError: error.message },
      { status: 500 }
    );
  }
}

// Simple TOTP verification function
async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      base32Decode(secret),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const counter = Math.floor(Date.now() / 1000 / 30);
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(4, counter, false);

    for (let offset = -1; offset <= 1; offset++) {
      const adjustedCounter = counter + offset;
      view.setUint32(4, adjustedCounter, false);
      const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
      const hmac = new Uint8Array(signature);
      const offset_index = hmac[hmac.length - 1] & 0x0f;
      const code = ((hmac[offset_index] & 0x7f) << 24 |
                    (hmac[offset_index + 1] & 0xff) << 16 |
                    (hmac[offset_index + 2] & 0xff) << 8 |
                    (hmac[offset_index + 3] & 0xff)) % 1000000;
      if (code.toString().padStart(6, '0') === token) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function base32Decode(str: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const strUpper = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < strUpper.length; i++) {
    const val = alphabet.indexOf(strUpper[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}
