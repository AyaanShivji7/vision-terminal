# Vision Terminal

An AI-powered investing terminal. Built with Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4, Clerk auth, Neon Postgres, Finnhub market data, and OpenAI (gpt-4o-mini). Optional brokerage linking via SnapTrade.

## What's in the app

- **Terminal dashboard** — live quotes, market news, watchlists, portfolio holdings, AI-generated "Daily Top Picks" with take-profit / stop-loss levels.
- **Screener** — live Finnhub quotes + candles with autocomplete ticker search.
- **AI chat** — multi-turn streaming assistant (`/api/chat`).
- **Portfolio intelligence** — OpenAI-powered narrative commentary on the user's holdings.
- **Brokerage sync (optional)** — SnapTrade connect flow pulls accounts and positions into Neon.
- **Daily cron** — `/api/cron/generate-top-picks` regenerates the 10 picks every day at 10:00 UTC (4:00 AM America/Edmonton).

## Quick start

```bash
git clone https://github.com/AyaanShivji7/vision-terminal.git
cd vision-terminal
npm install
cp .env.example .env.local   # fill in the values below
npm run db:migrate           # applies db/migrations/*.sql to DATABASE_URL
npm run dev
```

Open http://localhost:3000.

## Environment contract

All values live in `.env.local` during development and in Vercel's project settings in production.

### Required

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string. Used by `@neondatabase/serverless` in `lib/db.ts`. |
| `CLERK_SECRET_KEY` | Clerk backend secret. Enables server-side `auth()` and `clerkClient()`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key. |
| `OPENAI_API_KEY` | Used by the chat route and the daily top-picks generator (gpt-4o-mini). |
| `FINNHUB_API_KEY` | Used by `lib/finnhub.ts` for quotes, candles, news, and symbol search. Free tier: 60 req/min. |
| `NEXT_PUBLIC_APP_URL` | Base URL of the deployed app (e.g. `https://vision-terminal.vercel.app`). Used by SnapTrade redirect URLs and absolute links. |
| `CRON_SECRET` | Shared secret the Vercel cron header must match to hit `/api/cron/*`. |

### Admin gating (at least one of)

| Variable | Purpose |
| --- | --- |
| `ADMIN_USER_IDS` | Comma-separated Clerk user IDs allowed to call admin routes. Good for bootstrapping the first admin. |
| Clerk `publicMetadata.role = "admin"` | Preferred — set from the Clerk dashboard, no redeploy required. |

Admin routes: `/api/admin/generate-top-picks`, `/api/admin/seed-top-picks`, `/api/signals/refresh`.

### Optional — SnapTrade brokerage linking

| Variable | Purpose |
| --- | --- |
| `SNAPTRADE_CLIENT_ID` | SnapTrade client ID. |
| `SNAPTRADE_CONSUMER_KEY` | SnapTrade consumer key. |

Without these, `/api/brokerage/*` routes return errors and the brokerage UI is effectively hidden, but the rest of the app still works.

See `.env.example` for a copy-pasteable template.

## Database

Schema lives in `db/schema.sql` (authoritative) with additive migrations in `db/migrations/`. See [db/README.md](db/README.md) for details.

```bash
# First time, against an empty DB:
psql "$DATABASE_URL" -f db/schema.sql

# Or apply numbered migrations (tracked in a _migrations table):
npm run db:migrate
```

Tables:

- `portfolio_holdings` — manual portfolio entries, scoped by `clerk_user_id`.
- `watchlists`, `watchlist_items` — user watchlists.
- `daily_top_picks` — AI-generated picks shared across all users; one row per (`pick_date`, `rank`).
- `brokerage_users`, `brokerage_connections`, `brokerage_accounts`, `brokerage_positions` — SnapTrade-linked data.
- `app_users` — optional role cache for background jobs (Clerk metadata is the source of truth at request time).

## Vercel cron

`vercel.json` defines the daily picks job:

```json
{
  "crons": [
    { "path": "/api/cron/generate-top-picks", "schedule": "0 10 * * *" }
  ]
}
```

10:00 UTC = 4:00 AM America/Edmonton (safely past local midnight). The route verifies `Authorization: Bearer $CRON_SECRET`.

## Useful scripts

```bash
npm run dev         # Next.js dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run db:migrate  # apply pending db/migrations/*.sql
```

## Deploying

1. Push to GitHub.
2. Import into Vercel.
3. Add every env var from the table above in the Vercel project settings.
4. First deploy applies no migrations automatically — run `npm run db:migrate` locally against the production `DATABASE_URL`, or use Neon's SQL editor to run `db/schema.sql`.

## Repo layout

```
app/              Next.js App Router (pages + API routes)
components/       UI components
data/             Static data (seed picks, popular tickers)
db/               schema.sql, migrations, DB docs
lib/              Server-side helpers (Finnhub, DB, auth, SnapTrade, etc.)
scripts/          CLI scripts (migrate.mjs, etc.)
```

## License

Private project.
