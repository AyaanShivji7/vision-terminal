# Database

Vision Terminal runs on Neon Postgres via the `@neondatabase/serverless`
driver (see `lib/db.ts`).

## Files

- `schema.sql` — the authoritative current schema. Idempotent: running it
  against an empty or already-initialized database is safe.
- `migrations/NNNN_name.sql` — numbered, additive migrations. Each wraps its
  changes in `BEGIN; ... COMMIT;` and uses `IF NOT EXISTS` where possible.
  When you add a migration, also update `schema.sql` to match.

## First-time setup

Given a Neon connection string in `DATABASE_URL`:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Or apply migrations one at a time:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/migrations/0002_app_users.sql
```

## Admin / role gating

`app_users` mirrors a tiny slice of Clerk for role lookups in background
jobs. The request-time admin check (see `lib/auth.ts`) has two paths:

1. **Clerk `publicMetadata.role === "admin"`** (preferred) — set from the
   Clerk dashboard or via the Clerk Backend API. No redeploy needed.
2. **`ADMIN_USER_IDS` env allowlist** (fallback) — comma-separated Clerk
   user IDs. Used when Clerk metadata is unavailable or to bootstrap the
   first admin.

You only need one of these configured. Clerk metadata is recommended for
production.
