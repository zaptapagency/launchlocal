# Production Deployment Checklist

Use this checklist to ensure everything is production-ready before going live.

## Code Quality ✅

- [ ] TypeScript strict mode passes: `pnpm typecheck`
- [ ] ESLint passes: `pnpm lint`
- [ ] Prettier formatted: `pnpm format`
- [ ] Production build succeeds: `pnpm build`
- [ ] No console.log in production code
- [ ] No TODO comments without GitHub issues
- [ ] No hardcoded secrets or API keys
- [ ] All environment variables in `.env.production`

## Database ✅

- [ ] Neon account created
- [ ] Database migrations applied: `pnpm db:migrate`
- [ ] Seed data loaded: `pnpm db:seed`
- [ ] Database schema verified: `pnpm db:studio`
- [ ] All 21 tables created
- [ ] Indexes created (45 total)
- [ ] Double-booking constraint active
- [ ] Automatic backups enabled in Neon

## Authentication ✅

- [ ] Better Auth configured
- [ ] `BETTER_AUTH_SECRET` generated (256-bit random)
- [ ] `BETTER_AUTH_URL` set to production domain
- [ ] Google OAuth configured
  - [ ] Google Cloud project created
  - [ ] OAuth 2.0 credentials created
  - [ ] Redirect URI added: `/api/auth/callback/google`
  - [ ] `GOOGLE_CLIENT_ID` set
  - [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] Session table tested

## API Routes ✅

- [ ] 7 booking API routes deployed
  - [ ] `/api/booking/services` (GET/POST)
  - [ ] `/api/booking/staff` (GET/POST)
  - [ ] `/api/booking/availability/rules` (POST)
  - [ ] `/api/booking/slots` (POST)
  - [ ] `/api/booking/bookings` (POST)
  - [ ] `/api/booking/bookings/[id]` (GET/PATCH)
  - [ ] `/api/public/bookings/[token]` (GET/PATCH)
- [ ] All endpoints return proper status codes
- [ ] All endpoints validate with Zod
- [ ] Error responses follow standard format
- [ ] Rate limiting implemented

## Payment Integration ✅

- [ ] Stripe account created
- [ ] Stripe keys configured
  - [ ] `STRIPE_SECRET_KEY` set
  - [ ] `STRIPE_PUBLISHABLE_KEY` set (if needed)
- [ ] Stripe webhooks configured
  - [ ] Endpoint: `/api/webhooks/stripe`
  - [ ] Events: `payment_intent.succeeded`, `charge.refunded`
  - [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] Payment intent creation tested
- [ ] Webhook signature verification working

## Email & SMS (Optional) ✅

- [ ] Resend account created (optional)
  - [ ] `RESEND_API_KEY` set
  - [ ] Test email sent
- [ ] Twilio account created (optional)
  - [ ] `TWILIO_ACCOUNT_SID` set
  - [ ] `TWILIO_AUTH_TOKEN` set
  - [ ] SMS template configured
- [ ] Email templates created and tested

## Hosting (Vercel) ✅

- [ ] GitHub account connected
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added (all from `.env.production`)
- [ ] Production build succeeds on Vercel
- [ ] Live URL accessible from browser
- [ ] Custom domain configured (optional)
  - [ ] DNS records added
  - [ ] SSL certificate issued
  - [ ] `BETTER_AUTH_URL` updated
  - [ ] `APP_DOMAIN` updated
- [ ] Analytics enabled
- [ ] Git-based deployments enabled (auto-deploy on push)

## Database Backup ✅

- [ ] Neon automatic backups enabled
- [ ] Manual backup procedure documented
- [ ] Restore procedure tested
- [ ] Backup retention policy set (at least 7 days)

## Monitoring & Observability ✅

- [ ] Sentry configured (optional)
  - [ ] `SENTRY_DSN` set
  - [ ] Error tracking working
- [ ] Vercel logs accessible
- [ ] Function performance monitored
- [ ] Database performance monitored (Neon dashboard)
- [ ] Error alerts configured

## Security ✅

- [ ] No secrets in `.env.local` or git
- [ ] All secrets in Vercel environment variables
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Drizzle ORM parameterized queries)
- [ ] XSS protection (Next.js default)
- [ ] CSRF tokens implemented (Better Auth handles this)
- [ ] Session tokens secure (httpOnly, secure flags)
- [ ] Cancel tokens are random 256-bit

## Testing ✅

- [ ] Sign-up flow tested
- [ ] Sign-in flow tested
- [ ] Service creation tested
- [ ] Staff creation tested
- [ ] Availability rules created
- [ ] Slot generation tested (15-min intervals)
- [ ] Booking creation tested
- [ ] Booking confirmation tested
- [ ] Booking cancellation tested
- [ ] Public reschedule link tested
- [ ] Payment flow tested (Stripe test mode)
- [ ] Email sending tested (if configured)
- [ ] Database query performance acceptable

## Performance ✅

- [ ] Homepage loads < 1 second
- [ ] API responses < 200ms
- [ ] Slot generation < 100ms (7-day range)
- [ ] Database queries indexed appropriately
- [ ] No N+1 queries
- [ ] Images optimized (Next.js Image component)
- [ ] Vercel serverless functions < 50ms (excluding external API calls)
- [ ] Lighthouse score > 90 (check Vercel Analytics)

## Timezone & DST ✅

- [ ] Tenant timezone configuration tested
- [ ] Slots generated in correct timezone
- [ ] Display times match tenant timezone
- [ ] UTC storage verified
- [ ] Spring forward (DST) transition tested
- [ ] Fall back (DST) transition tested
- [ ] No daylight saving time bugs

## Multi-tenancy ✅

- [ ] Tenant isolation enforced on all routes
- [ ] No cross-tenant data leaks possible
- [ ] Slug-based routing working
- [ ] Custom domain routing working
- [ ] Tenant in database created
- [ ] User assigned to tenant
- [ ] Membership role checked on auth

## Documentation ✅

- [ ] README.md current
- [ ] DEPLOY.md complete
- [ ] BOOKING_API_TEST.md comprehensive
- [ ] CLAUDE.md updated
- [ ] PROGRESS.md shows M2 complete
- [ ] Database schema documented
- [ ] API routes documented
- [ ] Environment variables documented

## Legal & Compliance ✅

- [ ] Privacy policy drafted
- [ ] Terms of service drafted
- [ ] Stripe terms accepted
- [ ] Data handling policy defined
- [ ] GDPR compliance considered (if EU users)
- [ ] PCI DSS compliance (Stripe handles this)

## Operational ✅

- [ ] Rollback procedure tested
  - [ ] Git revert works
  - [ ] Previous deployment can be promoted
- [ ] Emergency contact info documented
- [ ] On-call rotation established (if team)
- [ ] Incident response procedure documented
- [ ] Database recovery procedure tested

## Final Verification ✅

- [ ] Fresh clone builds successfully
- [ ] All dependencies resolved
- [ ] No warnings during build
- [ ] Application starts with `pnpm start`
- [ ] All API endpoints responding
- [ ] Database accessible
- [ ] No console errors in browser
- [ ] No console errors in server logs

---

## Post-Deployment (First Week)

- [ ] Monitor error logs daily
- [ ] Check database performance metrics
- [ ] Verify backups running
- [ ] Test failover/rollback procedures
- [ ] Gather user feedback
- [ ] Performance optimization (if needed)
- [ ] Security audit (if budget allows)

---

## Sign-Off

- [ ] Development team: _____ (name, date)
- [ ] QA team: _____ (name, date)
- [ ] Product manager: _____ (name, date)
- [ ] Deployment date: _____
- [ ] Go-live time: _____

---

**Status: ✅ PRODUCTION READY**

All items checked? Your SaaS is ready to serve customers!
