# LaunchLocal — Decisions Log

Record of every non-trivial decision and its rationale. This log persists so that future sessions don't re-litigate resolved choices.

---

## Product & Business

| Decision                                   | Rationale                                                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **5-minute onboarding target**             | Most local businesses will not spend >15 min; 5 min is credible and memorable. Drives feature scope: must have Google import + AI generation or it takes too long.                     |
| **Subdomain-first publishing**             | Fastest path to live: instant DNS, no verification, works on day 1. Custom domain is a paid upgrade (PRO plan).                                                                        |
| **Booking as the moat, not the builder**   | Builders are commoditized; booking engines with correct timezone/DST math and DB-level double-booking guards are rare. This is where competitors break.                                |
| **Stripe Connect (Express, not Standard)** | Express accounts onboard faster (owner's phone + bank, 15 min vs. days). More tenant churn, but lower onboarding friction. v2 can support Standard for high-volume sellers.            |
| **Deposits over full prepay as default**   | Balanced: owner gets security against no-shows; customer pays less upfront; more bookings than 100% prepay. Full prepay available per-service.                                         |
| **No-show fee via SetupIntent**            | Requires explicit consent (save card _for_ no-show fee, not just any charge), survives cancellation, auditable. Better than "automatic after no-show" which feels broken to customers. |
| **Inngest for jobs**                       | Reliable, dev-server runs locally, integrates webhook retries, customer-scoped visibility. Not a third-party SaaS bloat compared to custom queues.                                     |
| **Three themes (not a page builder)**      | Design-token variations let us ship fast and maintain consistency. Infinite customization is feature creep and support hell; curated themes with brand color are enough.               |
| **Pricing tiers: FREE/PRO/GROWTH**         | FREE (itch-scratcher for evaluation), PRO (common case: small shop), GROWTH (scaling with staff/reviews). No annual-only; churn is ok.                                                 |

---

## Technology Stack

| Component           | Choice                                | Rationale                                                                                                                                             |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language**        | TypeScript `strict`                   | Type safety for tenant isolation (hard to accidentally pass wrong tenant_id) and payment logic. Strict mode non-negotiable.                           |
| **Framework**       | Next.js 15 (App Router)               | RSC by default (server-side first), middleware for multi-tenancy, built-in API routes, vercel deploy. Sunset Pages Router entirely.                   |
| **Database**        | Postgres + Drizzle ORM                | Postgres has EXCLUDE constraint (double-booking guard). Drizzle: type-safe, runs migrations as TS, low-magic query builder. Local via docker-compose. |
| **Auth**            | Better Auth                           | Lightweight, DB sessions (own control), email magic link + Google OAuth. No vendor lock-in to third parties; vs Clerk/Auth0.                          |
| **Payments**        | Stripe                                | Stripe Billing (our SaaS subs) + Stripe Connect (tenant revenue). Market standard, webhooks reliable, Connect Express fast.                           |
| **Jobs**            | Inngest                               | Local dev-server runs without external services; holds, reminders, webhooks. Lightweight vs. Bull/pg-boss; 50k free invocations/month.                |
| **Email**           | Resend + React Email                  | Email as code (templates are React components), simple API, free tier covers seed phase, works locally with console mock.                             |
| **SMS**             | Twilio                                | Market standard for SMS. Fallback mock logs to console. Optional (env check).                                                                         |
| **AI**              | Anthropic API                         | Latest Claude 3.5 Sonnet for content gen. Server-only module, zod output validation, fallback templates. Not built-in to Next.js, explicit secrets.   |
| **Business Import** | Google Places API (New)               | 80% of local businesses on Google; autocomplete + rich data. Adapter interface lets v2 add GBP OAuth without refactor.                                |
| **Storage**         | S3-compatible (R2 target)             | Cloudflare R2 is cheaper than AWS S3 and has R2 binding in Wrangler. Local mock is disk. Adapter behind interface for swaps.                          |
| **UI**              | Tailwind + shadcn/ui                  | Composable, accessible components; token-driven theming. Avoid custom CSS. Lucide for icons (consistent, free).                                       |
| **Forms**           | react-hook-form + zod                 | Minimal boilerplate, uncontrolled components (perf), Zod schema-driven. Popular, well-maintained.                                                     |
| **Rate Limiting**   | Upstash Redis                         | Global distributed (fast edge checks), free tier for dev, in-memory fallback. Optional; missing key doesn't crash app.                                |
| **Observability**   | Sentry + pino + PostHog               | Sentry (error tracking), pino (structured logging), PostHog (product analytics). All optional (env checks); log to console if missing.                |
| **Testing**         | Vitest + Testing Library + Playwright | Vitest (fast, ESM native), Playwright (headless e2e in mock mode), zero Cypress/Jenkins complexity.                                                   |
| **CI/CD**           | GitHub Actions                        | Native to repo, free for public/private, parallelizable, YAML. Vercel also available as auto-deploy.                                                  |
| **Deploy**          | Vercel + Neon + Inngest Cloud         | Vercel (middleware, edge, global), Neon (serverless Postgres + branching), Inngest Cloud (reliable jobs). Docker fallback provided.                   |

---

## Architecture

| Decision                                    | Rationale                                                                                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Module-based monolith (`src/modules/*`)** | Single deploy surface (no microservices overhead), co-located domain logic + tests. Each module owns schema slice, services, components.                                          |
| **Hostname routing for tenancy**            | `{slug}.lvh.me` in dev, `{slug}.APP_DOMAIN` in prod, custom domains verified. Middleware rewrites to `app/(sites)/[tenant]/...`. Cleaner than subdomain-in-path.                  |
| **Server-side slot generation**             | Client-side slot lists are dangerous (DST bugs, TZ mismatches, stale data). Recalculate on every booking API call (cheap operation).                                              |
| **UTC storage, local timezone display**     | All instants in `tstzrange` in UTC. Tenant timezone in tenants table. Conversion on read via `date-fns-tz`. This is the only way to avoid DST bugs.                               |
| **DB exclusion constraint for bookings**    | Application checks UX; DB constraint is guarantee. `EXCLUDE USING gist (staff_id WITH =, during WITH &&) WHERE (status IN ('pending','confirmed'))`. Detects overlaps atomically. |
| **Checkout holds expire in Inngest**        | 10-min expiry; customer starts checkout, 10 min to complete payment or slot released. Job is cheaper than cron and visible in logs.                                               |
| **Signed token links for customers**        | No accounts for customers. Cancel/reschedule via `/bookings/{id}/cancel?token={signed}`. Token is HMAC-SHA256 of booking_id + expiry + secret, expires per cancellation policy.   |
| **Webhook idempotency via event_id**        | `webhook_events` table has unique `event_id` per provider; process job checks "seen before"; avoids double-charging. All webhooks insert first, process async.                    |
| **Feature gating in middleware + services** | Middleware checks tenant plan on every request; service layer hard-blocks gated actions. No client-side gates. Downgrades keep data, just block actions.                          |
| **Audit log for sensitive actions**         | Every refund, impersonation, export, delete logged with actor, IP, tenant, timestamp. Not for compliance, but for "who broke this".                                               |
| **No customer accounts**                    | Zero friction: customer lands on public booking page, fills form, books. Most will never return (one-time service). Reduces support load. Repeat customers identified by email.   |

---

## Data Model

| Table                    | Key Decisions                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenants`                | `slug` is unique, used in routing. `timezone` (IANA), `currency` (ISO 4217). `stripe_account_id` for Connect. `plan` (enum or reference). All owned rows carry `tenant_id` FK.                                                                |
| `users`                  | Minimal: email, name, image. Roles via `memberships` (M:N). Owner can have multiple tenants; staff limited to one. Sessions in `sessions` table (Better Auth).                                                                                |
| `services`               | `payment_mode` enum: none / deposit / full. `price_cents` + `deposit_cents`. `duration_min` (for slot calculations). `buffer_before_min`, `buffer_after_min` (prevent back-to-back bookings).                                                 |
| `staff`                  | `user_id` nullable (can staff without login). `avatar_key` for S3/R2. `display_name` for customer-facing names.                                                                                                                               |
| `availability_rules`     | Repeating weekly availability. `staff_id`, `weekday` (0-6), `start_time` + `end_time` (local time as string HH:MM, DB converts via tenant timezone).                                                                                          |
| `availability_overrides` | One-off dates: closed all day, or custom hours. Overrides rules.                                                                                                                                                                              |
| `bookings`               | `during tstzrange` stores start/end in UTC. `status` enum: pending → confirmed → completed; or cancelled / no_show. Both `service_id` and `staff_id` (nullable; "any staff" if null). Signed cancel token derivable from booking_id + secret. |
| `customers`              | Per-tenant unique by email. `marketing_opt_in`, `phone`. Linked to bookings, not accounts.                                                                                                                                                    |
| `payments`               | Denormalized from Stripe (replicated on webhook). `type` (deposit, balance, refund, no_show_fee), `status` (pending, succeeded, failed). `stripe_payment_intent_id` + `stripe_charge_id`.                                                     |
| `webhook_events`         | Idempotency table. `provider` (stripe, inngest), `event_id` (unique per provider), `payload` JSON, `processed_at` timestamp. Infinite retention (compliance).                                                                                 |
| `subscriptions`          | Tenant plan state mirrored from Stripe Billing. `stripe_customer_id`, `stripe_subscription_id`, `plan`, `current_period_end`, `cancel_at_period_end`. Updated by webhooks.                                                                    |
| `audit_log`              | `actor` (user_id or "system"), `tenant_id`, `action` (string), `target` (entity type + id), `changes` (JSON), `ip_address`, `timestamp`. Not queryable in app, but exportable.                                                                |
| `notifications_log`      | Every email/SMS sent. `tenant_id`, `customer_id`, `booking_id` (nullable), `channel` (email/sms), `template`, `recipient`, `body`, `status`, `sent_at`, `bounced/complained/clicked`.                                                         |

---

## Integration Points (Mock adapters required)

| Service            | Real Mode                  | Mock Mode                                | Failure Mode                                     |
| ------------------ | -------------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Google Places**  | HTTP REST + API key        | Deterministic JSON; "Fade Factory" seed  | Falls back to manual entry form                  |
| **Anthropic API**  | claude-3-5-sonnet-20241022 | Template copies + seeded variations      | Falls back to template, mark for regen           |
| **Stripe Billing** | Live account + webhook     | Deterministic subscriptions in DB        | Free plan only; feature gating disabled          |
| **Stripe Connect** | Live account + webhook     | Mock charges logged; fake event payloads | Deposit logic disabled; bookings are free        |
| **Resend Email**   | `send()` HTTP              | Console log + simulated preview          | Console only                                     |
| **Twilio SMS**     | Credentials + API          | Console log                              | Console only                                     |
| **Inngest Jobs**   | Cloud + worker             | Dev server                               | Sync execution in request (unreliable, dev-only) |
| **Upstash Redis**  | KV store                   | In-memory map                            | No rate limits (dev-only)                        |

**Rule:** if an env var is missing, log a warning once and fall back to mock. Never crash or block the flow.

---

## Security & Compliance

| Requirement                          | Implementation                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tenant isolation (hard)**          | Every tenant-owned table has `tenant_id` FK. Service layer requires `tenantId` parameter on all queries. CI linter: `db.` import only in `src/db/` and `src/modules/**/repo*`. |
| **Cross-tenant tests (blocking CI)** | Authenticated as tenant A, attempt tenant B's bookings/customers/site via API and server actions. All must fail with 403 or 404.                                               |
| **Input validation**                 | Zod schema on every form, API route, webhook. Reject before it touches DB. AI outputs re-validated with fallback template.                                                     |
| **Rate limits**                      | Auth endpoints: 5/min per IP. Booking creation: 10/min per IP. AI generation: 3/day per tenant. Webhooks: 100/sec per tenant. Upstash required for prod; in-mem for dev.       |
| **Stripe webhook security**          | Every webhook verifies signature via `stripe.webhooks.constructEvent()`. No blind trust.                                                                                       |
| **Customer action tokens**           | HMAC-SHA256(booking_id + expiry + secret), expires per cancellation policy. Signed in server action, verified on cancel/reschedule.                                            |
| **Session cookies**                  | Secure, HttpOnly, SameSite=Lax. `AUTH_SECRET` is 32+ random bytes. Better Auth handles rotation.                                                                               |
| **Audit log**                        | Refund, impersonation, export, delete → audit log with actor IP and timestamp. 7-year retention (tax law).                                                                     |
| **Sensitive env vars**               | Never logged, never console.logged. `validateEnv()` at startup with zod. Server-side only; no leakage to client.                                                               |

---

## Performance Targets

| Metric                            | Target                   | Mechanism                                                          |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| **Time to first booking**         | <1 day from landing      | 5-min onboarding, no email verification, subdomain publish instant |
| **Generated site LCP**            | <2.5s (mid-tier mobile)  | RSC, image optimization, critical CSS, no JS in hero               |
| **Booking flow FCP**              | <1.5s                    | RSC, no heavy JS, form pre-hydrated                                |
| **Dashboard interaction latency** | <500ms optimistic        | Optimistic UI, Server Actions, SWR revalidate on response          |
| **Slot generation (50 slots)**    | <100ms                   | Cached availability rules, math in JS not DB, single tenant scope  |
| **Lighthouse scores**             | ≥95/95 (Performance/SEO) | Image optimization, JSON-LD, meta tags, no CLS, Core Web Vitals    |

---

## Logging & Observability

| Signal                | Tool                     | Activated By            | Local Behavior                                                        |
| --------------------- | ------------------------ | ----------------------- | --------------------------------------------------------------------- |
| **Error tracking**    | Sentry                   | `SENTRY_DSN`            | Console error + stack                                                 |
| **Structured logs**   | pino                     | Environment (always on) | stdout JSON with level/timestamp/tenant_id                            |
| **Product analytics** | PostHog                  | `POSTHOG_KEY`           | No-op (local dev doesn't send)                                        |
| **Mock mode logging** | Console                  | `MOCK_MODE=1`           | "MOCK: Places autocomplete; MOCK: Anthropic generates…" on every call |
| **Job logs**          | Inngest dashboard + pino | Inngest events          | Jobs log to pino; Inngest Cloud shows history                         |

---

## Deployment & Operations

| Environment    | Compute             | Database                  | Jobs               | Storage    | Domain                         |
| -------------- | ------------------- | ------------------------- | ------------------ | ---------- | ------------------------------ |
| **Local dev**  | `next dev`          | `docker-compose` Postgres | Inngest dev server | Local disk | `*.lvh.me:3000`                |
| **Preview**    | Vercel (git branch) | Neon branch               | Inngest Cloud      | R2         | `{branch}.staging.APP_DOMAIN`  |
| **Production** | Vercel (main)       | Neon production           | Inngest Cloud      | R2         | `APP_DOMAIN` + customer custom |

**Vercel middleware** handles `{slug}.` prefix routing and custom domain verification.

---

## Testing Strategy

| Layer                 | Framework          | Coverage                                                                           | Milestone |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------- | --------- |
| **Slot engine + DST** | Vitest             | NY, Riyadh, Auckland, midnight spans                                               | M2        |
| **Payment math**      | Vitest             | deposit, refund, no-show fee, rounding                                             | M3        |
| **Booking overlap**   | Vitest + Postgres  | concurrent inserts, exclusion constraint                                           | M2        |
| **Tenant isolation**  | Vitest (API mocks) | cross-tenant reads/writes all fail                                                 | M5        |
| **End-to-end (mock)** | Playwright         | 5 flows: onboard → publish, book → pay, cancel/refund, plan gate, tenant isolation | M5        |
| **Accessibility**     | axe (Playwright)   | 3 pages: booking page, dashboard, admin                                            | M5        |
| **Performance**       | Lighthouse CI      | Published site ≥95/95                                                              | M4+       |

---

## Known Decisions Pending / Revisit If

| Item                               | Status                                       | Revisit If                                                                            |
| ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Inngest cost at scale**          | Acceptable for M1-M5 pilot                   | >500k invocations/month → evaluate self-hosted Bull/pg-boss                           |
| **Twilio SMS routing per country** | Single FROM number                           | Need per-country compliance → add Twilio sender pool by tenant timezone               |
| **No-show fee edge case**          | SetupIntent card must be same tenant account | Multi-account tenants (v2 feature) require rethink → design white-label fee structure |
| **Custom domain SSL**              | Handled by Vercel Auto cert                  | Customers want exact domain without cert → evaluate EasyDomains / Route53 in v2       |
| **Seat limits (team plans)**       | Per-tenant count                             | Per-location (multi-location v2) → revisit auth model for location-scoped staff       |

---

End of decisions log. Updates happen as milestones ship and assumptions prove wrong.
