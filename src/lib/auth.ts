import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import { env } from './config';
import * as schema from '@/db/schema';

console.log('[AUTH] Initializing with drizzleAdapter...');
console.log('[AUTH] db available:', !!db);
console.log('[AUTH] env.AUTH_SECRET set:', !!env.AUTH_SECRET);

const adapter = drizzleAdapter(db, {
  provider: 'pg',
  schema,
});

console.log('[AUTH] Adapter created successfully');

// Initialize Better Auth with proper Drizzle adapter
export const auth = betterAuth({
  database: adapter,
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

console.log('[AUTH] Successfully initialized');

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
