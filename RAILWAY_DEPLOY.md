# LaunchLocal — Railway Deployment Guide

**Status:** ✅ PostgreSQL running on Railway
**Project:** launchlocal-saas
**GitHub:** https://github.com/zaptapagency/launchlocal

---

## Current Setup

✅ **Railway Project Created**
- Project ID: `b4fcee6a-c1c8-472f-8b43-2d986120a537`
- Workspace: zaptapagency's Projects
- PostgreSQL: Online and running in San Francisco

✅ **GitHub Repository**
- Repo: https://github.com/zaptapagency/launchlocal
- All code committed and pushed
- Railway.json config added

---

## Complete the Deployment (3 Steps)

### Step 1: Connect GitHub to Railway (2 minutes)

1. Go to Railway Dashboard:
   ```
   https://railway.app/project/b4fcee6a-c1c8-472f-8b43-2d986120a537
   ```

2. Click "+ New Service" → "GitHub Repo"

3. Authenticate with GitHub (if not already)

4. Select your repo:
   ```
   zaptapagency/launchlocal
   ```

5. Choose branch: `main`

6. Click "Deploy"

### Step 2: Configure Environment Variables (3 minutes)

Once the service is created, go to Variables tab and add:

```
# Database (auto-populated from Postgres service)
DATABASE_URL = postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway

# Authentication
BETTER_AUTH_SECRET = (run: openssl rand -hex 32)
BETTER_AUTH_URL = https://launchlocal-saas.railway.app

# Google OAuth (optional)
GOOGLE_CLIENT_ID = (from Google Cloud)
GOOGLE_CLIENT_SECRET = (from Google Cloud)

# AI Generation
ANTHROPIC_API_KEY = sk-ant-v4-...

# App Config
APP_DOMAIN = launchlocal-saas.railway.app
NODE_ENV = production
MOCK_MODE = 0
```

**Where to get DATABASE_URL:**
- Go to "Postgres" service → Variables tab
- Copy `DATABASE_URL` field

### Step 3: Deploy (5 minutes)

1. Railway will automatically build when you add the service
2. Wait for build to complete (watch build logs)
3. Service will deploy automatically

**Your app will be live at:**
```
https://launchlocal-saas.railway.app
```

---

## What Railway Does Automatically

✅ Builds your app: `pnpm install && pnpm build`
✅ Runs migrations: `pnpm db:migrate`
✅ Starts server: `pnpm start`
✅ Assigns domain: `launchlocal-saas.railway.app`
✅ Sets up SSL/HTTPS: Automatic
✅ Scales: Auto-scales based on traffic
✅ Monitors: Real-time logs and metrics

---

## Database Connection

PostgreSQL is already running in Railway:

```
Host: postgres.railway.internal
Port: 5432
Database: railway
User: postgres
Password: (shown in Postgres service Variables)
```

All environment variables from Postgres service are automatically available to your Next.js app.

---

## Monitoring & Logs

After deployment, monitor at:

```
https://railway.app/project/b4fcee6a-c1c8-472f-8b43-2d986120a537
```

**Tabs:**
- **Deployments** — See all deployments and rollback
- **Logs** — Real-time application logs
- **Metrics** — CPU, memory, network usage
- **Variables** — Environment configuration

---

## Testing Your Deployment

Once live, test:

```bash
# Check if app is running
curl https://launchlocal-saas.railway.app

# Test API endpoint
curl -X GET https://launchlocal-saas.railway.app/api/booking/services \
  -H "x-tenant-id: test-tenant"

# Follow BOOKING_API_TEST.md for full testing
```

---

## Rollback (if needed)

If something breaks:

1. Go to Railway Dashboard
2. Click "Deployments" tab
3. Find previous working version
4. Click "Rollback"
5. App reverts in < 1 minute

---

## Custom Domain (Optional)

Add your own domain:

1. In Railway → Settings
2. "Custom Domains" → Add Domain
3. Add DNS records (Railway provides them)
4. Update `BETTER_AUTH_URL` and `APP_DOMAIN` env vars

---

## Cost & Limits

**Free Tier:**
- Up to 672 hours/month (2 services running 24/7)
- 5 GB storage
- Enough for production use

**Pro Tier:**
- Starts at $5/month per active service
- Unlimited usage
- $0.000463 per GB-hour

Your usage will likely be:
- ~$5/month base (1 Next.js + 1 PostgreSQL)
- $0-10 for storage depending on traffic

Total: **$5-15/month** for production

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `BETTER_AUTH_SECRET` | Session encryption | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Auth callback URL | `https://launchlocal-saas.railway.app` |
| `ANTHROPIC_API_KEY` | AI generation | `sk-ant-v4-...` |
| `GOOGLE_CLIENT_ID` | OAuth login | From Google Cloud |
| `APP_DOMAIN` | Your domain | `launchlocal-saas.railway.app` |
| `NODE_ENV` | Environment | `production` |
| `MOCK_MODE` | Use mock APIs | `0` (for production) |

---

## Post-Deployment Checklist

After your app is live:

- [ ] Test homepage loads
- [ ] Test sign-up flow
- [ ] Test booking API (BOOKING_API_TEST.md)
- [ ] Check database has data
- [ ] Monitor logs for errors
- [ ] Test with real service creation
- [ ] Verify email sending (if configured)
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring alerts (optional)

---

## Troubleshooting

### Build failing?
1. Check build logs in Railway dashboard
2. Verify Node version (should be 18+)
3. Run `pnpm build` locally to test
4. Check dependencies in package.json

### Database connection error?
1. Verify DATABASE_URL in Variables
2. Check it matches Postgres service connection
3. Ensure PGUSER and PGPASSWORD are set
4. Test with: `psql "$DATABASE_URL" -c "SELECT 1"`

### App starting but returning 500s?
1. Check application logs in Railway
2. Verify all required env vars are set
3. Ensure migrations ran: `pnpm db:migrate`
4. Check BETTER_AUTH_URL matches domain

### Slow deployments?
1. First deploy takes longest (installs node_modules)
2. Subsequent deploys are faster (only changes)
3. Usually done in 3-5 minutes
4. Watch build logs to see progress

---

## Auto-Deploy from GitHub

Once connected, every push to `main` branch auto-deploys:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
# Railway auto-deploys!
```

Watch deployment at:
```
https://railway.app/project/b4fcee6a-c1c8-472f-8b43-2d986120a537/deployments
```

---

## Next Steps

1. **Complete Step 1-3 above** (10 minutes)
2. **Wait for build** (3-5 minutes)
3. **Test your app** (5 minutes)
4. **Share the URL:** `https://launchlocal-saas.railway.app`
5. **Invite team** to Railway project for collaboration

---

## Support

**Railway Docs:** https://docs.railway.app
**Status:** https://status.railway.app

Need help? Check:
- Railway dashboard logs
- Application console logs
- Database connection details
- Environment variables

---

**Your SaaS is deployed on Railway! 🚀**

All your code, database, and infrastructure is managed by Railway.
Every push to main automatically deploys.
Zero downtime updates included.

Next: Follow Steps 1-3 above to complete deployment.
