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
   - **Start Command:** `node dist/server.js`
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

**⚠️ Render Free Tier:** The backend will spin down after ~15 minutes of inactivity and cold-start in ~30 seconds. To keep it alive, set up a free cron ping at [cron-job.org](https://cron-job.org) hitting `/api/health` every 10 minutes.

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
