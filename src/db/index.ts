import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { env } from '@/lib/config';

// Create database connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Initialize drizzle ORM
export const db = drizzle(pool, { schema });

// Export schema for type inference
export * from './schema';
