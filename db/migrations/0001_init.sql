-- 0001_init.sql
--
-- Baseline migration. Apply once to a fresh database. Equivalent to
-- running db/schema.sql in full. Later migrations should be additive
-- (new tables/columns/indexes) and must also be reflected in schema.sql
-- so schema.sql stays the source of truth.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text NOT NULL,
  ticker         text NOT NULL,
  shares         numeric(18, 6) NOT NULL CHECK (shares > 0),
  buy_price      numeric(18, 4) NOT NULL CHECK (buy_price > 0),
  current_price  numeric(18, 4),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user
  ON portfolio_holdings (clerk_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS watchlists (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text NOT NULL,
  name           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_watchlists_user
  ON watchlists (clerk_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id  uuid NOT NULL REFERENCES watchlists (id) ON DELETE CASCADE,
  ticker        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist
  ON watchlist_items (watchlist_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_watchlist_items_watchlist_ticker
  ON watchlist_items (watchlist_id, ticker);

CREATE TABLE IF NOT EXISTS daily_top_picks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date         date NOT NULL,
  rank              integer NOT NULL CHECK (rank BETWEEN 1 AND 50),
  ticker            text NOT NULL,
  company           text,
  short_reason      text,
  summary           text,
  buy_zone          text,
  take_profit       text,
  stop_loss         text,
  reasoning         text,
  confidence_score  integer CHECK (confidence_score IS NULL OR confidence_score BETWEEN 1 AND 100),
  risk_level        text CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
  entry_price       numeric(18, 4),
  current_price     numeric(18, 4),
  signal_status     text,
  return_percent    numeric(10, 4) DEFAULT 0,
  outcome           text,
  closed_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_top_picks_date_rank
  ON daily_top_picks (pick_date, rank);
CREATE INDEX IF NOT EXISTS idx_daily_top_picks_date
  ON daily_top_picks (pick_date DESC);

CREATE TABLE IF NOT EXISTS brokerage_users (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id           text NOT NULL UNIQUE,
  snaptrade_user_id       text NOT NULL,
  snaptrade_user_secret   text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brokerage_connections (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id                text NOT NULL,
  snaptrade_authorization_id   text NOT NULL,
  brokerage_name               text,
  brokerage_slug               text,
  connection_status            text,
  disabled                     boolean DEFAULT false,
  created_at                   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_brokerage_connections_user_auth
  ON brokerage_connections (clerk_user_id, snaptrade_authorization_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_connections_user
  ON brokerage_connections (clerk_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS brokerage_accounts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id             text NOT NULL,
  brokerage_connection_id   uuid REFERENCES brokerage_connections (id) ON DELETE SET NULL,
  snaptrade_account_id      text NOT NULL,
  account_name              text,
  account_number            text,
  account_type              text,
  balance_json              jsonb,
  raw_json                  jsonb,
  last_synced_at            timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_brokerage_accounts_user_account
  ON brokerage_accounts (clerk_user_id, snaptrade_account_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_accounts_user
  ON brokerage_accounts (clerk_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS brokerage_positions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id             text NOT NULL,
  brokerage_account_id      uuid REFERENCES brokerage_accounts (id) ON DELETE CASCADE,
  snaptrade_account_id      text NOT NULL,
  symbol                    text,
  description               text,
  quantity                  numeric(18, 6),
  market_value              numeric(18, 4),
  average_purchase_price    numeric(18, 4),
  last_price                numeric(18, 4),
  raw_json                  jsonb,
  last_synced_at            timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brokerage_positions_user
  ON brokerage_positions (clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brokerage_positions_account
  ON brokerage_positions (brokerage_account_id);

COMMIT;
