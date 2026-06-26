# Invest-Tracker — Vercel Deployment Walkthrough

## Bugs Fixed

| # | File | Issue | Fix |
|---|---|---|---|
| 1 | `backend/src/routes/stocks.js` | `getQuote()` called but function is `getStockQuote()` | Renamed to `getStockQuote()`, also fixed `.currentPrice` → `.c` (Finnhub response field) |
| 2 | `backend/src/services/assetPriceService.js` | Unused `Stock` and `supabase` imports | Removed dead imports |
| 3 | `backend/src/server.js` | `app.listen()` runs unconditionally — crashes in Vercel serverless | Guarded with `VERCEL !== '1'` environment check |
| 4 | `frontend/package.json` | `react-router-dom` in `devDependencies` — not installed in prod builds | Moved to `dependencies` |
| 5 | `backend/vercel.json` | Missing — Vercel didn't know how to build/route the backend | Created with Node.js runtime config |
| 6 | `backend/src/server.js` | Hardcoded CORS origins — can't add new frontend domain without code change | Made dynamic via `FRONTEND_URL` env var |
| 7 | `backend/.env.example` | Missing — no reference for required env vars | Created with all required variables |

---

## Files Changed

```diff
backend/
+ vercel.json                          [NEW]  — Vercel serverless config for backend
+ .env.example                         [NEW]  — Documents all required env vars
  src/server.js                        [MOD]  — Guard app.listen(), dynamic CORS
  src/routes/stocks.js                 [MOD]  — Fix getStockQuote() call
  src/services/assetPriceService.js    [MOD]  — Remove unused imports

frontend/
  package.json                         [MOD]  — Move react-router-dom to dependencies
```

---

## Step-by-Step Vercel Deployment

> [!IMPORTANT]
> You need to push these changes to GitHub **before** deploying.

### Step 0 — Push Changes to GitHub

Run in your terminal:
```bash
cd c:\Users\RK\Desktop\Dev\Invest-Tracker
git add .
git commit -m "fix: prepare for Vercel deployment"
git push origin main
```

---

### Step 1 — Deploy the Backend

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your **KumareshRamachandran/Invest-Tracker** GitHub repository
3. In **Configure Project**:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other (Node.js)
   - **Build Command**: *(leave empty)*
   - **Output Directory**: *(leave empty)*
4. Click **Environment Variables** and add these:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase **service role** key |
| `FINNHUB_API_KEY` | Your Finnhub API key |
| `NEWS_API_KEY` | Your Marketaux API key |
| `METAL_API_KEY` | Your MetalPriceAPI key |

5. Click **Deploy**
6. After deployment, **copy your backend URL** (e.g., `https://invest-tracker-api.vercel.app`)

> [!TIP]
> Verify the backend works by visiting: `https://your-backend-url.vercel.app/api/health`  
> You should see: `{ "status": "ok", "message": "Server is running" }`

---

### Step 2 — Go Back to Backend Project & Add CORS Variable

After deploying the frontend (Step 3), come back here to add:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |

Then **Redeploy** the backend.

---

### Step 3 — Deploy the Frontend

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the **same GitHub repo** again
3. In **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Environment Variables** and add these:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon** key |
| `VITE_API_BASE_URL` | `https://your-backend-url.vercel.app/api` |

5. Click **Deploy**
6. Copy your **frontend URL** (e.g., `https://invest-tracker-frontend.vercel.app`)

---

### Step 4 — Update Backend CORS

1. Go to your **backend** Vercel project → **Settings → Environment Variables**
2. Add: `FRONTEND_URL` = `https://your-frontend.vercel.app`
3. Go to **Deployments** → click **⋯ → Redeploy**

---

### Step 5 — Verify Everything Works

- [ ] Visit your frontend URL — homepage loads
- [ ] Sign in / Sign up works (Supabase auth)
- [ ] Dashboard loads correctly
- [ ] Stock prices are fetched from backend
- [ ] Portfolio page shows data
- [ ] News page works

---

## Supabase Auth URL Configuration

> [!IMPORTANT]
> Add your Vercel frontend URL to Supabase Auth settings, or login will be blocked.

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL**: `https://your-frontend.vercel.app`
3. Add to **Redirect URLs**: `https://your-frontend.vercel.app/**`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| CORS error in browser | Add frontend URL to `FRONTEND_URL` env var on backend, redeploy backend |
| Auth redirect fails | Add frontend URL to Supabase → Auth → Redirect URLs |
| API calls return 401 | Check `SUPABASE_KEY` (backend) is the service role key, not anon key |
| Build fails — missing module | Run `npm install` locally and commit `package-lock.json` |
| `VITE_SUPABASE_URL` undefined | Ensure env vars are added in Vercel dashboard (not via `.env` file) |
