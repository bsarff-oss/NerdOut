# Point and Figure Pivot Detector

A web app that pulls daily prices from Tiingo, detects major Point and Figure
pivots, computes average run-up and run-down for each ticker, and surfaces
tickers currently at or past their historical average as trade signals.

Deployed on Vercel. Tiingo API token lives as a server-side environment
variable so users never see or handle it.

## What this is

For each configured ticker, the app pulls daily intraday H/L back to January 1,
2012 and applies a 5-box reversal at the ticker's volatility-tuned box size
(3% for stable large-caps, up to 15% for leveraged ETFs). The detected pivots
are charted and tabulated. The app then computes the average historical run-up
and run-down for each ticker and reports where today's price sits relative to
those averages. When a ticker reaches 100% of its average move, it's flagged
as a signal candidate.

## First-time setup (Bryan, once)

You need three things: a GitHub account, a Vercel account, and a Tiingo API
token. All three are free to create.

1. Get your Tiingo token from https://api.tiingo.com/account/api/token
2. Create a new repo on GitHub (e.g., `pf-detector`) and push this folder to it.
   From the unzipped folder:

   ```
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pf-detector.git
   git push -u origin main
   ```

3. In Vercel, click "Add New Project," import the repo you just created, and
   click Deploy. The first build will succeed but the app will return an error
   until step 4.

4. In the Vercel project settings, go to Settings → Environment Variables and
   add two variables:

   - `TIINGO_TOKEN` — paste your Tiingo token
   - `ACCESS_PASSWORD` — pick any phrase (e.g., "torch-relay-grid"). This is
     what you and Kenny will paste into the app to use it.

5. Trigger a redeploy from the Vercel dashboard (Deployments tab → ⋯ →
   Redeploy) so the new env vars take effect.

You're live. Vercel gives you a URL like `pf-detector-xyz.vercel.app`. That's
the URL you share with Kenny.

## For Kenny (and Bryan after deployment)

1. Open the URL.
2. Click "Pull from Tiingo" → enter the shared access password → click Start
   pull. The app fetches 25 tickers in about 15 seconds, dots turn green.
3. Click "Detect pivots." Open the Signals tab to see what's at or past its
   average. Click any row to jump to the chart.

The access password is stored in your browser so you only enter it once per
device. The Tiingo token is never visible to either of you; only the Vercel
server sees it.

## Changing the watchlist

The ticker configuration lives in `index.html` near the top of the script
block, in the `SHEETS` object. Each entry is
`[ticker, label, box_size_decimal]`. Edit there, commit, push. Vercel auto-
deploys on push to main, so within a minute Kenny will see the updated list
when he reloads.

## Box sizing notes

The box size determines how big a move needs to be before the algorithm
considers it a real pivot. With 5-box reversal, the effective threshold is
roughly (1 + box)^5 - 1. So 3% → 15.9% threshold, 5% → 27.6%, 10% → 61.0%,
15% → 101.1%. Higher box sizes are appropriate for more volatile names. The
defaults baked in are based on the original FANG Trading workbook plus
calibrations for leveraged ETFs.

## Local development

```
npm install -g vercel
cp .env.example .env.local
# Edit .env.local with your token and access password
vercel dev
```

Opens at `http://localhost:3000`.

## Files

- `index.html` — the entire frontend (one file, no build step)
- `api/tiingo.js` — serverless proxy to Tiingo with access password check
- `vercel.json` — Vercel routing and caching config
- `package.json` — project metadata
- `.env.example` — template for environment variables (do not commit real values)
- `.gitignore` — keeps secrets and build artifacts out of git

## Cost

Vercel hobby tier is free for personal use and well above what this app
consumes. Tiingo free tier allows 1,000 requests per day and 500 unique
tickers per month, which covers daily pulls of 25 tickers indefinitely. If
you want intraday data later, Tiingo paid tier is $10/month.
