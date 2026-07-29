import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getEnv } from '@/lib/config';

const env = getEnv();

// Create database connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Initialize drizzle ORM
export const db = drizzle(pool, { schema });

// Export schema for type inference
export * from './schema';
