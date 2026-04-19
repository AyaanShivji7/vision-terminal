-- 0002_app_users.sql
--
-- Add an app_users companion table for Clerk-backed role gating.
-- Clerk remains the source of truth for identity and publicMetadata.role;
-- this table exists so non-request code paths (cron, workers, audits) can
-- still resolve roles without a Clerk session.

BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  clerk_user_id   text PRIMARY KEY,
  email           text,
  role            text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users (role);

COMMIT;
