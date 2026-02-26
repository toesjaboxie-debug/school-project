import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Simple TOTP implementation using Web Crypto API
function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
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

async function generateSecret(): Promise<string> {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

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

function generateKeyUri(email: string, secret: string): string {
  const appName = encodeURIComponent('EduLearn AI');
  const userEmail = encodeURIComponent(email);
  return `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}&algorithm=SHA1&digits=6&period=30`;
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
  }
  return codes;
}

// POST - Enable/Disable/Verify 2FA
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { action, code, token } = body;

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (action === 'enable') {
      // Generate secret for TOTP
      const secret = await generateSecret();
      const backupCodes = generateBackupCodes();
      
      // Store temporarily until verified
      await db.user.update({
        where: { id: user.id },
        data: {
          backupCodes: JSON.stringify({
            twoFactorTemp: true,
            secret,
            backupCodes
          })
        }
      });

      // Generate otpauth URL for QR code
      const userEmail = dbUser.email || dbUser.username;
      const otpauthUrl = generateKeyUri(userEmail, secret);

      return NextResponse.json({
        success: true,
        secret,
        backupCodes,
        otpauthUrl,
        qrData: otpauthUrl,
        note: 'Scan de QR code met Google Authenticator, Authy, of een andere TOTP app'
      });
    }

    if (action === 'verify') {
      // Verify the TOTP code and enable 2FA
      if (!dbUser.backupCodes) {
        return NextResponse.json({ error: 'Geen 2FA setup in behandeling' }, { status: 400 });
      }

      const stored = JSON.parse(dbUser.backupCodes);
      if (!stored.twoFactorTemp || !stored.secret) {
        return NextResponse.json({ error: 'Geen 2FA setup in behandeling' }, { status: 400 });
      }

      // Verify TOTP code
      const isValid = await verifyTOTP(code, stored.secret);
      
      // Also check backup codes
      const isBackupCode = stored.backupCodes.includes(code?.toUpperCase());

      if (!isValid && !isBackupCode) {
        return NextResponse.json({ error: 'Ongeldige code. Probeer opnieuw.' }, { status: 400 });
      }

      // Remove used backup code
      let updatedBackupCodes = stored.backupCodes;
      if (isBackupCode) {
        updatedBackupCodes = stored.backupCodes.filter((c: string) => c !== code.toUpperCase());
      }

      // Enable 2FA
      await db.user.update({
        where: { id: user.id },
        data: {
          backupCodes: JSON.stringify({
            twoFactorEnabled: true,
            secret: stored.secret,
            backupCodes: updatedBackupCodes
          })
        }
      });

      return NextResponse.json({ success: true, message: '2FA ingeschakeld!' });
    }

    if (action === 'disable') {
      // Verify password or current 2FA code before disabling
      const stored = dbUser.backupCodes ? JSON.parse(dbUser.backupCodes) : null;
      
      if (stored?.twoFactorEnabled && stored.secret) {
        const isValid = await verifyTOTP(code, stored.secret);
        const isBackupCode = stored.backupCodes?.includes(code?.toUpperCase());
        
        if (!isValid && !isBackupCode) {
          return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 });
        }
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          backupCodes: null
        }
      });

      return NextResponse.json({ success: true, message: '2FA uitgeschakeld' });
    }

    if (action === 'verify-login') {
      // Verify 2FA code during login
      if (!dbUser.backupCodes) {
        return NextResponse.json({ error: '2FA niet ingeschakeld' }, { status: 400 });
      }

      const stored = JSON.parse(dbUser.backupCodes);
      if (!stored.twoFactorEnabled || !stored.secret) {
        return NextResponse.json({ error: '2FA niet ingeschakeld' }, { status: 400 });
      }

      const isValid = await verifyTOTP(code, stored.secret);
      const isBackupCode = stored.backupCodes?.includes(code?.toUpperCase());

      if (!isValid && !isBackupCode) {
        return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 });
      }

      // Remove used backup code
      if (isBackupCode) {
        const updatedBackupCodes = stored.backupCodes.filter((c: string) => c !== code.toUpperCase());
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

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error: any) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get 2FA status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    let twoFactorEnabled = false;
    let hasBackupCodes = false;
    
    if (dbUser.backupCodes) {
      try {
        const stored = JSON.parse(dbUser.backupCodes);
        twoFactorEnabled = stored.twoFactorEnabled === true;
        hasBackupCodes = (stored.backupCodes?.length || 0) > 0;
      } catch {}
    }

    return NextResponse.json({ 
      enabled: twoFactorEnabled,
      hasBackupCodes
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
