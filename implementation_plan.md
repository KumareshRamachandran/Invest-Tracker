# Vercel Deployment Plan — Invest-Tracker

## Overview
Deploy the Invest-Tracker monorepo as **two separate Vercel projects** from the same GitHub repo:
- **Frontend**: `frontend/` → Vite static site 
- **Backend**: `backend/` → Vercel Serverless Functions (Express via `api/index.js`)

---

## Bugs & Fixes Required

### Bug 1 — `getQuote` does not exist
**File**: `backend/src/routes/stocks.js` (line 118)  
`stockPriceService.getQuote()` is called but the function is named `getStockQuote()` in `stockPriceService.js`.  
**Fix**: Rename the call to `stockPriceService.getStockQuote(ticker)`.

### Bug 2 — Dead import in `assetPriceService.js`
**File**: `backend/src/services/assetPriceService.js` (line 2)  
Imports `Stock` model which is never used.  
**Fix**: Remove the unused import.

### Bug 3 — `app.listen()` in backend server breaks Vercel Serverless
**File**: `backend/src/server.js` (lines 48–52)  
Calling `app.listen()` is fine locally but causes issues in Vercel serverless. The `api/index.js` entry point imports from `server.js` which triggers `app.listen()`.  
**Fix**: Guard the `app.listen()` call so it only runs when NOT in a serverless environment.

### Bug 4 — `react-router-dom` in devDependencies (frontend)
**File**: `frontend/package.json`  
`react-router-dom` is listed in `devDependencies` but is a **runtime dependency** required for the app to function.  
**Fix**: Move it to `dependencies`.

### Bug 5 — Missing backend `vercel.json`
The `api/index.js` already exists as a Vercel serverless function entry, but the backend folder needs a `vercel.json` to configure Node.js runtime properly.  
**Fix**: Add `backend/vercel.json`.

---

## Proposed Changes

### Backend Changes

#### [MODIFY] [server.js](file:///c:/Users/RK/Desktop/Dev/Invest-Tracker/backend/src/server.js)
Guard the `app.listen()` call so it only fires when not running as a serverless function.

#### [MODIFY] [stocks.js](file:///c:/Users/RK/Desktop/Dev/Invest-Tracker/backend/src/routes/stocks.js)
Fix `getQuote()` → `getStockQuote()` on line 118.

#### [MODIFY] [assetPriceService.js](file:///c:/Users/RK/Desktop/Dev/Invest-Tracker/backend/src/services/assetPriceService.js)
Remove unused `Stock` and `supabase` imports.

#### [NEW] `backend/vercel.json`
Configure Vercel for Node.js serverless function deployment from the `backend/` subdirectory.

---

### Frontend Changes

#### [MODIFY] [package.json](file:///c:/Users/RK/Desktop/Dev/Invest-Tracker/frontend/package.json)
Move `react-router-dom` from `devDependencies` to `dependencies`.

#### [MODIFY] [vercel.json](file:///c:/Users/RK/Desktop\Dev\Invest-Tracker\frontend\vercel.json) (already exists)
Already correct — no changes needed.

---

## Environment Variables Required

### Frontend Vercel Project
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_BASE_URL` | Your backend Vercel URL + `/api` (e.g., `https://invest-tracker-api.vercel.app/api`) |

### Backend Vercel Project
| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase service role key |
| `FINNHUB_API_KEY` | Your Finnhub API key |
| `NEWS_API_KEY` | Your Marketaux news API key |
| `METAL_API_KEY` | Your MetalPriceAPI key |

---

## Deployment Steps (after fixes)

1. Push changes to GitHub
2. Create Vercel project for **Backend**: Root = `backend/`, framework = None (Node.js)
3. Add backend environment variables in Vercel dashboard
4. Deploy backend → copy the deployment URL
5. Create Vercel project for **Frontend**: Root = `frontend/`, framework = Vite
6. Add frontend environment variables (use backend URL for `VITE_API_BASE_URL`)
7. Deploy frontend

---

## Verification Plan
- Backend health check: `GET /api/health` returns `{ status: 'ok' }`
- Frontend: Auth/login works, dashboard loads correctly
