import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from './config';

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export interface SessionData extends Record<string, string | undefined> {
  userId: string;
  email: string;
  name?: string;
  tenantId?: string;
}

export async function createToken(data: SessionData): Promise<string> {
  const jwt = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return jwt;
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function setSession(data: SessionData): Promise<string> {
  const token = await createToken(data);
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
