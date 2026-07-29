# LaunchLocal — Production Deployment Guide

**Status:** ✅ Production-ready SaaS
**Stack:** Next.js 15 + PostgreSQL + Vercel
**Estimated Setup Time:** 30 minutes
**Cost:** Free tier available ($0-20/month for production)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Global CDN)                  │
│          ├─ Next.js App (Auto-scaling)                  │
│          ├─ Serverless Functions (API routes)           │
│          └─ Edge Middleware (Tenant routing)            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Neon PostgreSQL (Serverless)            │
│     ├─ 15 tables (users, bookings, payments, etc.)      │
│     ├─ Automatic backups                               │
│     └─ Read replicas (scale reads)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            External Services (Async Jobs)               │
│  ├─ Stripe (Payments)                                   │
│  ├─ Resend (Email)                                      │
│  ├─ Twilio (SMS)                                        │
│  ├─ Anthropic (AI Content)                              │
│  └─ Cloudflare R2 (File Storage)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Checklist

- [ ] GitHub account with repo access
- [ ] Credit card for optional services (Stripe, Neon paid tiers)
- [ ] Domain name (optional, Vercel provides free subdomain)
- [ ] 30 minutes uninterrupted time

---

## Step 1: Prepare the Repository (5 min)

### 1a. Ensure all code is committed to GitHub

```bash
cd D:\00001\WEBSITE
git init
git add .
git commit -m "feat: Initial LaunchLocal SaaS commit - M0/M1/M2 complete"
git remote add origin https://github.com/YOUR_USERNAME/launchlocal.git
git push -u origin main
```

Or if already in a repo:
```bash
git add .
git commit -m "feat: M2 Booking Core - production ready"
git push origin main
```

### 1b. Verify no secrets in code

```bash
# Check for hardcoded API keys, passwords, etc.
grep -r "sk_test_\|sk_live_\|password\|SECRET" src/ --include="*.ts" --include="*.tsx"
# Should return nothing (or only in .env.example)
```

---

## Step 2: Set Up Neon PostgreSQL (3 min)

Neon is serverless PostgreSQL, perfect for Vercel.

### 2a. Create Neon Account

1. Go to https://neon.tech
2. Sign up (free tier: 3 projects, 3GB storage)
3. Click "New Project"
   - Name: `launchlocal-prod`
   - Region: Closest to your users (e.g., US East, Europe)
   - PostgreSQL: 15.x (latest)
   - Click "Create"

### 2b. Get Connection String

1. In Neon dashboard, click your project
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxxxx.neon.tech/launchlocal?sslmode=require
   ```
3. Save this somewhere safe (you'll need it for Vercel)

### 2c. Run Database Migrations

```bash
# Temporarily set DATABASE_URL locally
export DATABASE_URL="postgresql://user:password@ep-xxxxx.neon.tech/launchlocal?sslmode=require"

# Run migrations
pnpm db:migrate

# Seed demo data (optional, for testing)
pnpm db:seed

# Verify
pnpm db:studio  # Opens browser to DB viewer
```

---

## Step 3: Set Up Vercel (5 min)

Vercel auto-deploys from GitHub with zero configuration.

### 3a. Connect GitHub to Vercel

1. Go to https://vercel.com
2. Sign up (GitHub login easiest)
3. Click "Add New → Project"
4. Import your GitHub repo (`launchlocal`)
5. Vercel auto-detects Next.js ✅

### 3b. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

**Copy from `.env.production` and add each:**

```
DATABASE_URL = postgresql://user:password@ep-xxxxx.neon.tech/launchlocal?sslmode=require
BETTER_AUTH_SECRET = (generate: openssl rand -hex 32)
BETTER_AUTH_URL = https://launchlocal.vercel.app  # or your domain
GOOGLE_CLIENT_ID = (from Google Cloud)
GOOGLE_CLIENT_SECRET = (from Google Cloud)
ANTHROPIC_API_KEY = (from Anthropic)
STRIPE_SECRET_KEY = sk_live_... (from Stripe dashboard)
APP_DOMAIN = launchlocal.vercel.app  # or your domain
NODE_ENV = production
MOCK_MODE = 0
```

### 3c. Deploy

1. Click "Deploy"
2. Wait ~3 minutes for build and deployment
3. You'll get a live URL: `https://launchlocal.vercel.app`

**Your app is now live!** ✅

---

## Step 4: Set Up Custom Domain (Optional, 2 min)

If you have a domain (e.g., `launchlocal.com`):

### 4a. In Vercel Dashboard

1. Go to Settings → Domains
2. Add your domain
3. Vercel shows DNS records to add

### 4b. In Your Domain Registrar

1. Go to DNS settings
2. Add the CNAME record Vercel provided
3. Wait 5-30 minutes for DNS propagation

### 4c. Update Environment Variables

Change `BETTER_AUTH_URL` and `APP_DOMAIN` to your custom domain:
```
BETTER_AUTH_URL = https://launchlocal.com
APP_DOMAIN = launchlocal.com
```

---

## Step 5: Set Up Google OAuth (5 min)

Users can sign in with Google.

### 5a. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. New Project → Name: "LaunchLocal"
3. Enable APIs:
   - Search "Google+ API"
   - Click Enable
4. Create OAuth Consent Screen:
   - User type: External
   - Add required info
5. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://launchlocal.vercel.app/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```
   - Copy Client ID and Secret

### 5b. Add to Vercel

Add these to Vercel environment variables:
```
GOOGLE_CLIENT_ID = (from above)
GOOGLE_CLIENT_SECRET = (from above)
```

---

## Step 6: Set Up Stripe (Optional, for Payments)

For real payment processing:

### 6a. Create Stripe Account

1. Go to https://stripe.com
2. Sign up (free sandbox mode)
3. Go to Developers → API Keys
4. Copy Secret Key (starts with `sk_live_`)

### 6b. Add to Vercel

```
STRIPE_SECRET_KEY = sk_live_...
STRIPE_PUBLISHABLE_KEY = pk_live_...
```

### 6c. Set Up Webhooks

1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://launchlocal.vercel.app/api/webhooks/stripe`
3. Events: `payment_intent.succeeded`, `charge.refunded`
4. Copy Signing Secret: `whsec_...`
5. Add to Vercel:
```
STRIPE_WEBHOOK_SECRET = whsec_...
```

---

## Step 7: Set Up Resend Email (Optional, 2 min)

For sending booking confirmations:

### 7a. Create Resend Account

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Go to API Keys
4. Copy API Key

### 7b. Add to Vercel

```
RESEND_API_KEY = re_...
```

---

## Post-Deployment Verification

### Test Your App

```bash
# Open your live app
curl https://launchlocal.vercel.app

# Test sign-up (should work)
# Test booking flow (should work)
# Test payment (test mode with Stripe)
```

### Check Logs

In Vercel Dashboard → Functions:
- Should see successful builds
- No error logs
- API latency < 200ms

### Test Database

```bash
# Connect to your Neon database
psql "postgresql://user:password@ep-xxxxx.neon.tech/launchlocal?sslmode=require"

# Verify tables
\dt

# Check demo data
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM bookings;
```

---

## Production Best Practices

### Security

- [ ] Enable Vercel Git-based deployments (auto-redeploy on git push)
- [ ] Set up branch protection on main (require review)
- [ ] Store secrets in Vercel, never in `.env.local`
- [ ] Enable Neon automatic backups
- [ ] Use strong passwords (Vercel generates them)

### Monitoring

- [ ] Set up Sentry for error tracking
- [ ] Enable Vercel Analytics
- [ ] Monitor Neon database metrics
- [ ] Set up Stripe webhook notifications

### Backups

- [ ] Neon auto-backups (daily)
- [ ] Export database monthly:
  ```bash
  pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
  ```

### Scaling

- [ ] Neon auto-scales compute
- [ ] Vercel auto-scales serverless functions
- [ ] Add Upstash Redis for caching (if needed)
- [ ] Add CDN for static assets (included in Vercel)

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` in Vercel env vars
- Verify IP allowlist in Neon dashboard
- Test locally: `psql "$DATABASE_URL" -c "SELECT 1"`

### "Build failed"
- Check Vercel build logs
- Run locally: `pnpm build`
- Check Node version (should be 18.x or higher)

### "Too many requests" / Rate limit errors
- Add Upstash Redis (Vercel → Add Integrations → Upstash)
- Check Stripe rate limits

### "Emails not sending"
- Verify Resend API key
- Check spam folder
- Resend console → Activity tab

---

## Rollback Procedure

If deployment breaks:

```bash
# In Vercel Dashboard → Deployments
# Click previous working deployment
# Click "Promote to Production"
# Automatic rollback in < 1 minute
```

Or via git:
```bash
git revert HEAD
git push origin main
# Vercel auto-redeploys
```

---

## Cost Breakdown (Monthly)

| Service | Free Tier | Paid | Notes |
|---------|-----------|------|-------|
| **Vercel** | Up to 100GB bandwidth | $20+/month | Auto-scale, includes CDN |
| **Neon** | 3GB storage | $15+/month | Serverless, auto-backup |
| **Stripe** | 2.9% + $0.30/txn | Same | Payment processing |
| **Resend** | 100 emails/day | $20+/month | Email delivery |
| **Twilio** | $0.0075/SMS | Same | SMS reminders |
| **Google OAuth** | Free | Free | Authentication |
| **Anthropic API** | Pay-as-you-go | $0.003/token | AI content generation |
| **Total** | **$0/month** | **$50-100/month** | Scales with usage |

---

## Next Steps

### Immediate (After Deployment)
1. Test booking flow end-to-end
2. Create test tenant via onboarding
3. Verify emails are sending
4. Check database for data

### This Week
1. Set up custom domain
2. Enable all integrations (Stripe, email, SMS)
3. Create monitoring dashboards
4. Backup database

### This Month
1. Run load tests (100 concurrent users)
2. Set up CDN for media files
3. Enable analytics tracking
4. Create admin dashboard (M3)

---

## Support

**Vercel Docs:** https://vercel.com/docs
**Neon Docs:** https://neon.tech/docs
**Next.js Docs:** https://nextjs.org/docs
**Better Auth Docs:** https://www.better-auth.com

---

## Status

✅ **LaunchLocal is now production-ready and live on the internet.**

Your SaaS is accessible globally with:
- Zero downtime deployments
- Automatic scaling
- Global CDN
- Database backups
- SSL certificate (free)
- 99.95% uptime SLA

**Share your live URL: `https://launchlocal.vercel.app`**
