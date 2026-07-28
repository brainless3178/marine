# Deployment Guide — Alka Traders

## Architecture

```
┌─────────────────┐     /api/*      ┌─────────────────────┐
│  Netlify (SPA)  │ ──────────────► │  Render (Backend)   │
│  Frontend       │                 │  Express + Prisma   │
│  alkatraders.*  │                 │  alka-traders-api   │
└─────────────────┘                 └──────────┬──────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │     NeonDB           │
                                    │  PostgreSQL (cloud)  │
                                    └─────────────────────┘
```

---

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in with GitHub (`alishasaiyed1996-dev`)
2. Click **New +** → **Web Service**
3. Connect the GitHub repo: `alishasaiyed1996-dev/alka-traders`
4. Fill in:
   - **Name:** `alka-traders-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `node dist/backend/src/server.js`
   - **Plan:** Free
5. Click **Advanced** → Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(your NeonDB connection string with `?sslmode=require`)* |
| `DIRECT_URL` | *(your NeonDB direct connection string — same as above but without `-pooler`)* |
| `JWT_SECRET` | *(generate a random 64-char hex string)* |
| `CORS_ORIGIN` | `https://YOUR-NETLIFY-SITE.netlify.app` |
| `FRONTEND_URL` | `https://YOUR-NETLIFY-SITE.netlify.app` |
| `ADMIN_URL` | `https://YOUR-NETLIFY-SITE.netlify.app/admin` |
| `PORT` | `3001` |
| `PAYPAL_CLIENT_ID` | *(your PayPal client ID)* |
| `PAYPAL_CLIENT_SECRET` | *(your PayPal client secret)* |
| `PAYPAL_MODE` | `sandbox` |
| `RESEND_API_KEY` | *(your Resend API key)* |
| `EMAIL_FROM` | `noreply@alkatraders.com` |
| `RFQ_EMAIL` | `rfq@alkatraders.com` |
| `EMERGENCY_EMAIL` | `emergency@alkatraders.com` |
| `ADMIN_EMAIL` | `admin@alkatraders.com` |
| `DEFAULT_SHIPPING_COST` | `25` |
| `DEFAULT_TAX_RATE` | `0.08` |
| `COMPANY_NAME` | `Alka Traders` |
| `COMPANY_EMAIL` | `info@alkatraders.com` |
| `WHATSAPP_NUMBER` | `919726900547` |

6. Click **Create Web Service**
7. Wait for the deploy to finish — your backend URL will be something like `https://alka-traders-api.onrender.com`
8. Test: Visit `https://alka-traders-api.onrender.com/api/health`

**⚠️ Render Free Tier:** The backend will spin down after ~15 minutes of inactivity and cold-start in ~30 seconds. To keep it alive, set up a free cron ping (see keep-alive setup below).

---

## Keep-Alive Setup (Required for Render Free Tier)

Render's free tier spins down the backend after ~15 minutes of inactivity. The first request after spin-down takes **30-60 seconds** (cold start). This burns crawl budget, hurts Core Web Vitals, and frustrates users.

**Fix:** Ping the health endpoint every 5 minutes from an external monitor. Choose one option below.

### Option A: cron-job.org (Recommended — Free, No Account Required)

[cron-job.org](https://cron-job.org) is free, requires no credit card, and supports custom intervals.

1. Go to [cron-job.org](https://cron-job.org) and create a free account
2. Click **Create Cronjob**
3. Fill in:
   - **Title:** `Alka Traders Keep-Alive`
   - **URL:** `https://YOUR-BACKEND-URL.onrender.com/api/health`
   - **Schedule:** Every **5 minutes** (or use cron expression `*/5 * * * *`)
   - **Request Method:** `GET`
   - **Notification:** Optional (email on failure)
4. Click **Create**
5. Test: After the first ping, check your backend logs for `"GET /api/health"` entries

### Option B: UptimeRobot (Free Tier — 50 Monitors)

[UptimeRobot](https://uptimerobot.com) offers 50 monitors on the free plan with 5-minute checks.

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up
2. Click **Add New Monitor**
3. Fill in:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Alka Traders API`
   - **URL / IP:** `https://YOUR-BACKEND-URL.onrender.com/api/health`
   - **Monitoring Interval:** `5 minutes`
   - **Advanced:** Set timeout to `30 seconds` (Render cold starts can be slow)
4. Click **Create Monitor**

### Option C: GitHub Actions (If you want it in-repo)

Add `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Alive
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping health endpoint
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            "https://YOUR-BACKEND-URL.onrender.com/api/health" || true
```

**⚠️ Note:** GitHub Actions scheduled workflows on free plans may be delayed by up to 30 minutes during runner queue congestion. cron-job.org is more reliable for tight intervals.

### Verification

After setting up the keep-alive, confirm it works:

1. Wait at least 10 minutes (allows for cron scheduling granularity)
2. Visit `https://YOUR-BACKEND-URL.onrender.com/api/health` in a browser
3. Expected response time: **< 2 seconds** (warm, not cold-started)
4. Expected body:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-07-28T..."
}
```

If you see a 30+ second delay, the keep-alive is NOT working — the instance is spinning down between pings. Check the monitor's logs.

---

## Step 2: Deploy Frontend to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and sign in with GitHub
2. Click **Add new site** → **Import an existing project**
3. Choose GitHub → select `alishasaiyed1996-dev/alka-traders`
4. Fill in:
   - **Branch to deploy:** `master`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**
6. After first deploy, go to **Site settings** → **Environment variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `/api` (proxy handles it) |
| `VITE_SITE_URL` | `https://YOUR-NETLIFY-SITE.netlify.app` |
| `VITE_APP_VERSION` | `1.0.0` |

7. Go back to **Deploys** → click **Trigger deploy** → **Deploy site**
8. Your site is live at `https://YOUR-NETLIFY-SITE.netlify.app`

---

## Step 3: Connect Frontend to Backend

After both are deployed:

1. Update `netlify.toml` — replace `https://alka-traders-api.onrender.com` with your actual Render URL
2. Update Render env vars — set `CORS_ORIGIN`, `FRONTEND_URL`, and `ADMIN_URL` to your actual Netlify URL
3. Commit and push — Netlify will auto-deploy

---

## Step 4: Generate a Secure JWT_SECRET

Run this locally to generate a secure secret:

```bash
openssl rand -hex 32
```

Copy the output and set it as `JWT_SECRET` in Render.

---

## Step 5: Update Admin Password

After deployment, log in with the admin credentials created during the database seed:

- **Email:** admin@alkatraders.com
- **Password:** *(set during seed — change immediately after first login)*

**⚠️ Change the admin password immediately after first login via the Admin Panel!**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Make sure `CORS_ORIGIN` in Render matches your Netlify URL exactly |
| API returns 404 | Check that `VITE_API_URL=/api` is set in Netlify env vars |
| NeonDB connection fails | Verify `sslmode=require` is in the DATABASE_URL |
| Build fails on Render | Check build logs — make sure `prisma generate` runs before `tsc` |
| Blank page on refresh | SPA redirect is configured in netlify.toml — should work automatically |
