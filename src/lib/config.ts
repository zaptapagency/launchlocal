import { z } from 'zod';

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_DOMAIN: z.string().default('localhost:3000'),
  APP_DOMAIN_PUBLIC: z.string().default('http://localhost:3000'),
  AUTH_SECRET: z.string().min(32),
  MOCK_MODE: z
    .string()
    .transform((val) => val === '1' || val === 'true')
    .default(() => true),

  // Database (M0)
  DATABASE_URL: z.string().url(),

  // Auth (M0)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Places (M1)
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // AI (M1)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Stripe (M3)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().optional(),

  // SMS (M4)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  // Jobs (M2+)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Storage (M1+)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Rate limiting (M5+)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    const errors = env.error.flatten();
    console.error('Invalid environment variables:', errors);
    throw new Error(`Invalid environment: ${JSON.stringify(errors)}`);
  }

  parsedEnv = env.data;
  return parsedEnv;
}

// Parse env at startup
export const env = getEnv();
