'use server';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { getDb } from '@/db';
import { getEnv } from './config';
import * as schema from '@/db/schema';

// Lazy-initialize auth to defer driver initialization until first use
let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (authInstance) return authInstance;

  try {
    const env = getEnv();
    const db = getDb();

    // Initialize Better Auth with proper Drizzle adapter
    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema,
      }),
      appName: 'LaunchLocal',
      baseURL: env.APP_DOMAIN_PUBLIC,
      basePath: '/api/auth',
      secret: env.AUTH_SECRET,
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google:
          env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
              }
            : undefined,
      },
      plugins: [],
    });

    return authInstance;
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    throw error;
  }
}

// Export auth object for backwards compatibility
export const auth = {
  handler: (request: Request) => getAuth().handler(request),
};

export type Session = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};
