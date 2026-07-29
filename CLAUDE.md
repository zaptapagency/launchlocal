# LaunchLocal — Developer Reference

Quick reference for resuming work. Read this first in every session.

---

## TL;DR: Resume Protocol

1. Read `PROGRESS.md` (what's shipped, what's next, blockers)
2. Read `PLAN.md` (milestone breakdown, acceptance criteria)
3. Read `DECISIONS.md` (why we made each architectural choice)
4. Check the current milestone in PROGRESS.md
5. Run `pnpm dev` to verify the app boots
6. Pick the next incomplete task from the milestone
7. Update PROGRESS.md at the end of every milestone close

---

## Project Overview

**LaunchLocal** is a 5-minute onboarding SaaS for local businesses: type your name → get a live website with booking, payments, and automated reminders.

- **Codename:** `launchlocal`
- **Repository:** Single Next.js monolith with modular architecture
- **Primary Language:** TypeScript (strict)
- **Database:** Postgres + Drizzle ORM
- **Package Manager:** pnpm

---

## Quick Commands

```bash
# Development
pnpm dev                 # Start Next.js dev server + Inngest dev server
pnpm dev:web            # Next.js only
pnpm dev:inngest        # Inngest dev server only

# Quality gates (run before committing)
pnpm typecheck          # TypeScript strict check
pnpm lint               # ESLint + Prettier
pnpm test               # Vitest unit + integration tests
pnpm test:e2e           # Playwright (mock mode only; real Stripe key required for payment flows)
pnpm build              # Full build (catch errors early)

# Database
docker-compose up -d    # Boot Postgres locally (port 5432)
pnpm db:migrate         # Run Drizzle migrations
pnpm db:seed            # Populate "Fade Factory" demo tenant
pnpm db:reset           # Wipe and migrate (dev only!)
pnpm db:studio          # Drizzle Studio (http://localhost:5555)

# Code generation
pnpm db:gen             # Generate Drizzle schema from migrations

# Clean up
pnpm clean              # Remove node_modules, .next, dist
```

---

## Environment Setup

**Local development requires:**

```bash
git clone <repo>
cd launchlocal
pnpm install
docker-compose up -d           # Postgres on localhost:5432
cp .env.example .env.local
pnpm db:migrate && pnpm seed   # Apply migrations + seed demo data
pnpm dev                       # Start server on http://localhost:3000
```

**No external keys needed.** All services run in `MOCK_MODE=1` by default:

- Google Places → seeded "Fade Factory" lookup
- Anthropic API → template fallback (logged)
- Stripe → mock charges (logged)
- Twilio → console SMS (logged)
- Inngest → dev server (no Cloud required)
- Upstash → in-memory rate limiter

---

## Directory Structure

```
src/
  app/                          # Next.js routes (App Router)
    (marketing)/                # Public landing, pricing, etc.
    (auth)/                     # Sign-in, sign-up, magic link
    (dashboard)/                # Owner dashboard (requires auth)
      [slug]/                   # Tenant-scoped routes
        bookings/
        customers/
        services/
        staff/
        settings/
        billing/
    (sites)/                    # Public customer-facing site
      [tenant]/...              # Dynamic per-tenant site
    admin/                      # Superadmin panel (superadmin role only)
    api/                        # API routes (webhooks, public endpoints)
  modules/
    tenants/                    # Tenant CRUD, plan state
    sites/                      # Site generation, storage, publishing
    booking/                    # Slot engine, hold logic, bookings
    services/                   # Service CRUD, staff, availability
    payments/                   # Payment intents, refunds, deposits
    billing/                    # Stripe Billing subscriptions, gating
    notifications/              # Email + SMS adapter, logs
    reviews/                    # Review requests, imports
    customers/                  # Customer CRUD, history
    import/                     # Business import (Places adapter)
    ai/                         # Content generation (Anthropic adapter)
    admin/                      # Superadmin logic
  db/
    schema.ts                   # Drizzle schema definition
    migrations/                 # Auto-generated SQL migrations
    seed.ts                     # Seed data for demo ("Fade Factory")
  lib/
    auth.ts                     # Better Auth configuration
    adapters/
      places.ts                 # BusinessImportAdapter (Google Places + mock)
      storage.ts                # StorageAdapter (R2 + local disk)
      notifications.ts          # NotificationAdapter (Resend + Twilio + mock)
      ai.ts                     # AIAdapter (Anthropic + fallback)
    middleware.ts               # Multi-tenant routing, hostname detection
    rate-limit.ts               # Rate limiter (Upstash + in-memory fallback)
    utils/                      # Helpers (zod validators, date-fns-tz wrappers)
  emails/                       # React Email templates
```

**Principle:** Each module owns its domain. Routes stay thin; business logic lives in modules and is unit-testable.

---

## Architecture Principles

### Multi-tenancy (hard requirement)

- Every tenant-owned table has `tenant_id` FK.
- Service layer **requires** `tenantId` parameter on all queries. No raw `db.` calls from handlers.
- CI linter fails if `db.` is imported outside `src/db/` or `src/modules/**/repo*`.
- Hostname routing: `{slug}.lvh.me` (local) → `{slug}.APP_DOMAIN` (prod) + custom domains.
- Middleware (`lib/middleware.ts`) rewrites to `app/(sites)/[tenant]/...`.

### Booking correctness (moat)

- All instants stored in UTC as `tstzrange`.
- Tenant timezone (IANA string) stored in `tenants` table; all slot math server-side via `date-fns-tz`.
- **Double-booking impossible at DB level:** `EXCLUDE USING gist (staff_id WITH =, during WITH &&) WHERE (status IN ('pending','confirmed'))`.
- Application checks are UX; DB constraint is guarantee.
- Checkout holds expire in Inngest (10 min).

### Payments

- **Our SaaS revenue:** Stripe Billing (plans: FREE, PRO $29, GROWTH $79; 14-day trial).
- **Tenant revenue:** Stripe Connect (Express onboarding; destination charges to tenant account with platform fee).
- All money in integer cents; currency from tenant.
- Webhooks verified, idempotent (unique `event_id`), never re-process.

### Security & isolation (hard)

- AuthZ check on every server action + route handler (session → membership → tenant scope).
- Cross-tenant isolation tests (CI-blocking).
- Zod validation on every input boundary.
- Rate limits on auth, booking, AI, webhooks.
- Signed + expiring tokens for customer actions (no accounts).
- Audit log for sensitive actions (refunds, impersonation, exports, deletes).

### Performance

- Generated sites: LCP <2.5s mid-tier mobile.
- Site pages are RSC with static caching (`revalidateTag(tenant)`).
- Lighthouse ≥95/95 target.
- Dashboard optimistic UI where safe.

---

## Key Files & Patterns

| File                                 | Purpose                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| `src/lib/auth.ts`                    | Better Auth config (email + Google OAuth)                        |
| `src/lib/middleware.ts`              | Hostname → tenant routing, custom domain verification            |
| `src/modules/booking/slot-engine.ts` | Core slot generation + DST logic (heavily unit-tested)           |
| `src/modules/payments/stripe.ts`     | Stripe Connect setup, charges, refunds                           |
| `src/modules/billing/gating.ts`      | Feature gate checks (soft-block with CTA)                        |
| `src/db/schema.ts`                   | Complete Drizzle schema; the source of truth for DB structure    |
| `src/db/seed.ts`                     | "Fade Factory" demo tenant (idempotent, deterministic)           |
| `src/lib/adapters/*.ts`              | Interfaces for external services (mock implementations included) |

### Adapter Pattern (key for testability + mocking)

Every external service goes through an adapter interface. Example:

```typescript
// lib/adapters/ai.ts
export interface AIAdapter {
  generateSiteDocument(
    profile: BusinessProfile
  ): Promise<SiteDocument>;
}

// Real implementation
export const anthropicAdapter: AIAdapter = { ... };

// Mock implementation (used in MOCK_MODE)
export const mockAdapter: AIAdapter = { ... };

// In the module
const aiAdapter = process.env.MOCK_MODE ? mockAdapter : anthropicAdapter;
```

This pattern ensures:

- Zero external keys required for local development
- Deterministic tests (mock always returns same data)
- Failures never crash; fallback templates always exist
- Swapping real ↔ mock requires one env var

---

## Tenant Isolation Testing (§7)

Critical for SaaS: a cross-tenant data leak is company-ending.

**Test approach:**

1. Create test users: `ownerA`, `ownerB` (different tenants)
2. AuthN as `ownerA`
3. Attempt to fetch/mutate `ownerB`'s bookings, customers, site, payments via every API route and server action
4. All must fail with 403 or 404 (never 200 or error details that leak `ownerB` exists)

**Example test file:** `src/modules/booking/__tests__/isolation.test.ts`

Tests live in `src/modules/**/__tests__/` (colocated with domain logic).

---

## DST & Timezone Testing (§5.4)

The booking engine is the moat; DST bugs are dealbreakers.

**Test cases (required for M2):**

1. **Spring forward (US):** booking crossing 2:00 AM → 3:00 AM on second Sunday in March
2. **Fall back (US):** booking crossing 2:00 AM → 1:00 AM on first Sunday in November
3. **No DST (Middle East):** Asia/Riyadh slots (ensure we don't try to apply DST when there is none)
4. **Southern hemisphere:** Pacific/Auckland (DST in December/January)
5. **Midnight-spanning rule:** availability rule spans 11 PM–1 AM; ensure it generates correct slots across day boundary

**Test file:** `src/modules/booking/slot-engine.test.ts` (Vitest)

Use `date-fns-tz` for all timezone conversions:

```typescript
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Convert UTC instant to tenant's local time
const localTime = toZonedTime(utcInstant, tenantTimezone);

// Convert local time back to UTC
const utcInstant = fromZonedTime(localTime, tenantTimezone);
```

---

## Logging & Debugging

### Structured logging (pino)

All infrastructure logs via pino (stdout, JSON):

```typescript
import { pino } from 'pino';
const log = pino();

log.info({ tenant_id, booking_id, action: 'booking_created' });
log.error({ error: err.message, stack: err.stack });
```

### Mock mode logging

When `MOCK_MODE=1`, all external calls log to console:

```
MOCK: Places autocomplete for "Fade"
MOCK: Anthropic generates SiteDocument (token usage: 1200 input, 450 output)
MOCK: Stripe destination charge created (id: ch_mock_123)
```

### Sentry (optional)

If `SENTRY_DSN` set, errors ship to Sentry. Otherwise, pino only.

### Local dev tips

```bash
# Watch tests
pnpm test --watch

# Debug a single test
pnpm test src/modules/booking/slot-engine.test.ts

# Drizzle Studio (interactive DB browser)
pnpm db:studio  # http://localhost:5555

# Inspect logs (pino)
pnpm dev | grep tenant_id  # Filter by tenant_id
```

---

## Branching & Commits

### Branch names

```
feat/{feature-name}     # New feature
fix/{issue}             # Bug fix
chore/{task}            # Refactor, tooling, docs
```

### Commit messages

Conventional Commits:

```
feat: onboarding flow with Google Places import
fix: DST calculation in America/New_York timezone
test: add concurrent booking overlap test
chore: upgrade Next.js to 15.1
docs: update README with deploy instructions
```

### Quality gate before commit

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

If any step fails, fix it. No `// @ts-ignore` or `.eslintignore` workarounds.

---

## Deployment

**Local:** `docker-compose up -d && pnpm db:migrate && pnpm seed && pnpm dev`

**Preview (Vercel + Neon):** Merge to `staging` branch (auto-deploys; uses Neon preview database)

**Production:** Merge to `main` branch (auto-deploys; uses Neon production database)

See `DEPLOY.md` for detailed instructions (created at M5 end).

---

## Common Pitfalls & How to Avoid

| Pitfall                | Prevention                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Cross-tenant data leak | Every service layer function requires `tenantId` param. CI linter checks for `db.` imports outside allowed paths.        |
| DST bugs in slot math  | All calculations server-side in tenant timezone. UTC storage only. Vitest with all edge cases.                           |
| Double-booking         | Postgres EXCLUDE constraint (not application logic). Insert in transaction; catch violation and show "slot taken" UX.    |
| Stripe webhook drift   | Verify signature, idempotent via `webhook_events` unique `event_id`, process async in Inngest job.                       |
| Feature gate bypass    | Gate checks in middleware + service layer. Client cannot bypass (no client-side gates).                                  |
| Lost money on refunds  | All refund math in cents, unit-tested. Stripe refund API called in job (retryable). Reconciliation report in superadmin. |
| Broken email templates | React Email templates unit-tested (render → HTML). Preview in browser before ship.                                       |

---

## Release Checklist (§11 Definition of Done)

At M6 end, verify **honestly**:

- [ ] Fresh clone, zero external keys, `pnpm dev` works end to end
- [ ] All 5 Playwright flows pass in mock mode; CI fully green
- [ ] DB exclusion constraint tested under concurrent inserts (separate test file)
- [ ] All DST unit tests pass (NY, Riyadh, Auckland, midnight span)
- [ ] Cross-tenant isolation suite 100% (attempt tenant B access as tenant A; all fail)
- [ ] Real Stripe test keys: Connect onboarding, deposit charge, refund, Billing subscription each tested once
- [ ] Lighthouse ≥95/95 on seeded published site; axe: zero serious violations
- [ ] No `any` types, no skipped tests, no `console.log` in app, no TODO without issue
- [ ] `README.md`, `DEPLOY.md`, `PROGRESS.md`, `DECISIONS.md`, `LAUNCH_NOTES.md` current

---

## Questions?

- Check DECISIONS.md for "why" on any tech choice
- Check PLAN.md for milestone acceptance criteria
- Check the relevant module's `__tests__/` folder for examples
- Grep for `MOCK_MODE` to see fallback patterns

---

**Last updated:** 2026-07-09 (M0 scaffolding)
