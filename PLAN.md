# LaunchLocal — Product & Milestone Plan

## North-star metric

A business goes from "no website" to "first paid booking" in under one day.

## Product in one sentence

Type your business name → get a live, beautiful, SEO-ready website with online booking, payments, and automated reminders — in under 5 minutes.

## Wedge

Roughly half of small local businesses have no real website. Existing site builders take hours. We collapse "get online + get booked + get paid" into one 5-minute flow.

## Key differentiators (ship these or don't ship)

1. **5-minute magic onboarding** — Google Places import; AI writes site; owner approves
2. **Serious booking engine** — timezone-correct, DST-proof, double-booking impossible at DB level, deposits, no-show fees, reminders
3. **Revenue features** — deposits, prepayment, no-show protection, review growth
4. **Local SEO autopilot** — perfect Core Web Vitals, LocalBusiness JSON-LD, sitemaps, OG images
5. **Built to expand (v2 design)** — AI chat, missed-call text-back, GBP sync, white-label

---

## Milestones (each ends demoable, all green)

### M0 — Foundations

- [ ] Scaffold Next.js 15 + TS strict, pnpm, .env.example fully documented
- [ ] Drizzle + `docker-compose.yml` Postgres local
- [ ] Better Auth: email magic link + Google OAuth, sessions in DB
- [ ] Tenancy middleware: `{slug}.lvh.me` routing, multi-tenant isolation
- [ ] Base UI: Tailwind CSS + shadcn/ui, design tokens (3 themes)
- [ ] GitHub Actions CI: typecheck → lint → build → test
- [ ] `CLAUDE.md` (conventions, commands, architecture), `DECISIONS.md`, `PROGRESS.md`
- [ ] `pnpm dev` with zero external keys boots fully in mock mode
- **Gate:** `pnpm typecheck && pnpm lint && pnpm build` all pass; Postgres boots

### M1 — Import & Generate

- [ ] Places adapter (with mock) — autocomplete, import, preview
- [ ] AI pipeline (Anthropic) — content generation → zod-validated `SiteDocument`
- [ ] Site renderer — RSC pages, theme #1 (modern), static caching
- [ ] Onboarding flow — search → import → generate → edit stub → publish
- [ ] Publish to subdomain (`{slug}.lvh.me`)
- [ ] Seed script — "Fade Factory Barbershop" (Riyadh tz, 2 staff, 5 services, 15 bookings)
- **Accept:** `pnpm seed` creates demo tenant; generated site has complete copy and imagery; mock import is deterministic
- **Gate:** full e2e in mock mode; Lighthouse ≥90 on seeded site

### M2 — Booking Core

- [ ] Services CRUD (name, duration, price, payment mode, buffers, deposit)
- [ ] Staff CRUD (display name, avatar, email invites)
- [ ] Availability engine (weekly rules + date overrides + closures)
- [ ] Slot generation (tenant timezone, DST-proof)
- [ ] Double-booking guard: Postgres EXCLUDE constraint
- [ ] Checkout holds (10-min expiry via Inngest)
- [ ] Public booking flow (service → staff → slot → form → confirmation email + ICS)
- [ ] Dashboard: today view, week calendar, bookings table, actions
- [ ] Cancel/reschedule via signed tokens (no account required)
- **Accept:** two simultaneous checkouts of the last slot → exactly one succeeds; all DST unit tests pass; slot math matches customer timezone on rendering
- **Gate:** 5 Playwright flows pass; exclusion constraint tested under concurrency

### M3 — Money (Stripe)

- [ ] Stripe Connect Express onboarding (with status polling, webhooks)
- [ ] Deposits + full prepay logic (per-service payment mode)
- [ ] Destination charges to tenant account with platform fee
- [ ] Refunds (full/partial) from dashboard per cancellation policy
- [ ] No-show fee (SetupIntent card-on-file, explicit consent, owner marks no-show to charge)
- [ ] Webhook safety: signature verification, idempotent `webhook_events`, retry jobs
- [ ] Payments UI: status tracking, reconciliation log
- **Accept:** in test mode, flow from booking → deposit charge → dashboard → refund with Stripe test events
- **Gate:** payment math unit tested; webhook idempotency verified; all Stripe test keys optional (mock adapter takes over if missing)

### M4 — Growth Layer

- [ ] SMS via Twilio (deposit confirmations, 24h + 2h reminders, review requests)
- [ ] Reminder jobs via Inngest (reliable, visible in logs)
- [ ] Review requests (email + SMS, Google link, sent/clicked tracking)
- [ ] Themes #2–3 (warm, bold) as design-token variations
- [ ] Editor UX: inline text edit, image upload/crop, "regenerate with AI" + tone chips, theme switcher, brand color
- [ ] Custom domains (verification flow, wildcard DNS setup docs)
- [ ] Full SEO pack: LocalBusiness JSON-LD, sitemap, robots, OG images, privacy/terms auto-generation
- [ ] Marketing landing page for LaunchLocal
- **Accept:** end-to-end booking → SMS reminder arrives on test phone; seeded site at custom domain renders perfectly with OG image
- **Gate:** Lighthouse ≥95 on seeded published site; all SMS mocks log clearly

### M5 — Monetize & Harden

- [ ] Stripe Billing: FREE / PRO $29 / GROWTH $79 plans, 14-day trial on paid
- [ ] Customer portal (plan changes, invoices)
- [ ] Feature gating (soft-block with contextual upgrade CTA)
- [ ] Pricing page + site footer + dashboard plan indicator
- [ ] Superadmin panel (`/admin`): tenant health, impersonate owner (audited + banner), flags
- [ ] Rate limiting (auth, booking, AI, webhooks) via Upstash + fallback
- [ ] Audit log (sensitive actions: refunds, impersonation, exports, deletes)
- [ ] a11y pass: WCAG AA on booking + dashboard (axe zero serious)
- [ ] Complete Playwright suite (5 flows + cross-tenant isolation + gating)
- [ ] `README.md`, `DEPLOY.md`, updated `PROGRESS.md`
- **Accept:** plan downgrades keep data, block gated actions with CTA; one superadmin can impersonate a tenant and see their bookings; export/delete works
- **Gate:** all CI green; Lighthouse ≥95 / SEO ≥95; zero serious axe violations; cross-tenant isolation suite 100%

### M6 — Launch Review & Docs

- [ ] Run honest §11 checklist (Definition of Done)
- [ ] Fix every gap, no exceptions
- [ ] `LAUNCH_NOTES.md`: known limitations, mocked areas, v2 interface map
- [ ] `DEPLOY.md` with Vercel + Neon + Inngest Cloud instructions and local Docker alternative
- [ ] Seed script validated across 3 timezones
- [ ] Fresh clone bootstrap test (documented, reproducible)
- **Gate:** all §11 items true; fresh clone zero-key boot works end to end

---

## Feature specs (acceptance criteria per §6)

### 6.1 Onboarding & Import

- Search-as-you-type Places autocomplete
- Manual entry fallback
- Preview imported data
- Generation <60s with streamed progress
- Lands in editor with publish CTA
- **Mock:** typing "Fade Factory" → complete draft site

### 6.2 Site Editor

- Reorder/toggle sections
- Inline text edit
- Per-section "Regenerate with AI" + tone chips
- Image upload with crop
- Theme switcher, brand color picker
- Mobile/desktop preview
- Publish/unpublish
- **Accept:** every edit persists, preview matches published exactly

### 6.3 Public Booking Flow

- Service → (optional staff) → date/time grid → form → policies/consent → payment → confirmation
- No account required
- Mobile-friendly
- Reschedule/cancel via signed token links
- **Accept:** slot list never shows unbookable time; two simultaneous checkouts of last slot → exactly one succeeds

### 6.4 Dashboard

- Today view (next appointments, quick actions)
- Week calendar
- Bookings table (filters, actions)
- Customers (history, notes)
- Services CRUD
- Staff CRUD with email invites
- Availability editor (rules + overrides + "closed today")
- Revenue & stats
- Settings (info, branding, notifications, policies, domain, billing)
- **Accept:** new booking visible in ≤5s; all actions audited

### 6.5 Reviews Engine

- N hours post-completion, send review request (email + SMS)
- Google review link
- Sent/clicked tracking
- Suppress repeats per customer per 30 days
- Imported reviews in testimonial section
- **Accept:** visible in notifications_log and analytics on seeded flow

### 6.6 Plans & Gating

- **FREE:** subdomain only, ≤20 bookings/mo, badge, 1 staff, 1.0% fee
- **PRO $29/mo:** custom domain, unlimited bookings, reminders, no badge, 3 staff, 0.5% fee
- **GROWTH $79/mo:** unlimited staff, review engine, no-show, priority support, 0% fee
- Graceful soft-block with contextual CTA
- Downgrade keeps data, blocks gated actions
- **Accept:** feature gate + CTA works; downgrade from PRO → FREE removes "3 staff" access with clear message

### 6.7 Superadmin

- Tenant list with health/plan/MRR
- Impersonate owner (audited + banner)
- Feature flags
- Webhook/job failure views

### 6.8 Marketing Site

- Landing (hero + live demo)
- Pricing
- Sign-in
- Fast, credible, conversion-focused

---

## Non-functional requirements

### Security (hard)

- AuthZ check on every server action and route handler
- Cross-tenant isolation tests (CI-blocking)
- Zod validation on every input boundary
- Rate limits on auth, booking, AI, webhooks
- Stripe webhook signature verification
- Signed + expiring customer tokens
- Secure session cookies, strict CSP
- Uploads: type/size validated, re-encoded via sharp
- Secrets server-side only; audit log on sensitive actions

### Performance

- Generated sites: LCP <2.5s on mid-tier mobile
- Dashboard: snappy interactions, optimistic UI where safe

### Accessibility (WCAG AA)

- Booking flow + dashboard keyboard navigable
- Visible focus, labeled forms
- Axe checks in CI: 3 key pages, zero serious violations

### Data & Compliance

- Customer export/delete (owner-initiated)
- SMS/email opt-out for non-transactional
- Cookie banner if analytics active
- Marketing consent stored on customers

---

## Testing strategy

- **Vitest:** slot engine (DST: NY, Riyadh, Auckland + midnight span), overlaps, holds, fees, gating, signed tokens
- **Playwright (mock mode):** (1) onboard → generate → publish → visit; (2) book → pay → dashboard → reminder; (3) cancel + refund; (4) tenant isolation; (5) plan gates
- **CI:** typecheck → lint → unit → build → e2e (mock) → axe
- **Seed:** deterministic "Fade Factory" (Riyadh) with 15 realistic bookings
- **MOCK_MODE=1:** all external calls logged deterministically

---

## Definition of Success (§11 Checklist)

- [ ] Fresh clone, zero external keys, `pnpm dev` works fully
- [ ] All 5 Playwright flows pass in mock mode; CI fully green
- [ ] DB exclusion constraint tested under concurrent inserts
- [ ] All DST/timezone unit tests pass
- [ ] Cross-tenant isolation suite passes
- [ ] Real Stripe test keys: Connect, deposit, refund, Billing each verified once
- [ ] Lighthouse ≥95/95 on seeded published site; axe zero serious
- [ ] No `any`, no skipped tests, no `console.log` in app code, no TODO without issue
- [ ] `README.md`, `DEPLOY.md`, `PROGRESS.md`, `DECISIONS.md`, `LAUNCH_NOTES.md` current

---

## v2 Features (design clean stubs, do NOT build)

Google Calendar sync · AI receptionist chat · missed-call text-back · GBP OAuth sync & AI review replies · agency workspaces / white-label · memberships & packages · multi-location

## Non-goals

Native mobile apps · POS/inventory · public marketplace · email campaigns
