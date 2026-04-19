-- 0003_pricing_columns.sql
--
-- Add structured numeric pricing columns to daily_top_picks so signal
-- math doesn't have to regex the LLM's free-form buy_zone / take_profit /
-- stop_loss strings on every refresh.
--
-- The original text columns remain authoritative for display; the
-- numeric columns are a derived view written at insert time by the
-- picks generator (lib/generateDailyTopPicks.ts) and by seed/admin
-- routes that call lib/pricing.ts.

BEGIN;

ALTER TABLE daily_top_picks
  ADD COLUMN IF NOT EXISTS buy_zone_low      numeric(18, 4),
  ADD COLUMN IF NOT EXISTS buy_zone_high     numeric(18, 4),
  ADD COLUMN IF NOT EXISTS take_profit_low   numeric(18, 4),
  ADD COLUMN IF NOT EXISTS take_profit_high  numeric(18, 4),
  ADD COLUMN IF NOT EXISTS stop_loss_value   numeric(18, 4);

-- Helpful index for "picks within X% of their take-profit" style queries.
CREATE INDEX IF NOT EXISTS idx_daily_top_picks_tp_low
  ON daily_top_picks (take_profit_low);

COMMIT;
