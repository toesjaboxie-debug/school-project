import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';
import { User } from '@prisma/client';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'session_user_id';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!userId) {
    return null;
  }
  
  return { userId };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  const user = await db.user.findUnique({
    where: { id: session.userId },
  });
  
  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createUser(username: string, password: string, isAdmin: boolean = false): Promise<User> {
  const hashedPassword = await hashPassword(password);
  
  return db.user.create({
    data: {
      username,
      password: hashedPassword,
      isAdmin,
    },
  });
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = await db.user.findUnique({
    where: { username },
  });
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  return user;
}
