'use server';

import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';
import { getEnv } from './config';

// Lazy-initialize auth to defer driver initialization until first use
let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (authInstance) return authInstance;

  try {
    const env = getEnv();

    // Initialize database connection pool
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      // Set connection timeout to catch database connectivity issues early
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20,
    });

    // Initialize Drizzle ORM with schema
    const db = drizzle(pool, { schema });

    // Initialize Better Auth with database adapter
    authInstance = betterAuth({
      database: db,
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
