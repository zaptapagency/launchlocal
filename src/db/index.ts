import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getEnv } from '@/lib/config';

// Lazy-initialize database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  try {
    const env = getEnv();

    // Create database connection pool
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20,
    });

    // Initialize drizzle ORM
    dbInstance = drizzle(pool, { schema });
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Lazy-export db as a getter
Object.defineProperty(module.exports, 'db', {
  get() {
    return getDb();
  },
  enumerable: true,
});

// Export schema for type inference
export * from './schema';
