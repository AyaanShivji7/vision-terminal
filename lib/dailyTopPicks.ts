import { sql } from "@/lib/db";
import { getEdmontonDateString } from "@/lib/date";

export type DailyTopPick = {
  id: string;
  pickDate: string;
  rank: number;
  ticker: string;
  company: string;
  shortReason: string;
  summary: string;
  buyZone: string;
  takeProfit: string;
  stopLoss: string;
  reasoning: string;
  confidenceScore: number | null;
  riskLevel: string | null;
  entryPrice: number | null;
  currentPrice: number | null;
  signalStatus: string | null;
  returnPercent: number | null;
  outcome: string | null;
  createdAt: string;
  closedAt: string | null;
};

function mapRow(row: any): DailyTopPick {
  return {
    id: row.id,
    pickDate: String(row.pick_date),
    rank: Number(row.rank),
    ticker: row.ticker,
    company: row.company,
    shortReason: row.short_reason,
    summary: row.summary,
    buyZone: row.buy_zone,
    takeProfit: row.take_profit,
    stopLoss: row.stop_loss,
    reasoning: row.reasoning,
    confidenceScore:
      row.confidence_score === null ? null : Number(row.confidence_score),
    riskLevel: row.risk_level ?? null,
    entryPrice: row.entry_price === null ? null : Number(row.entry_price),
    currentPrice: row.current_price === null ? null : Number(row.current_price),
    signalStatus: row.signal_status ?? null,
    returnPercent:
      row.return_percent === null ? null : Number(row.return_percent),
    outcome: row.outcome ?? null,
    createdAt: String(row.created_at),
    closedAt: row.closed_at ? String(row.closed_at) : null,
  };
}

export async function getDailyTopPicks() {
  const today = getEdmontonDateString();

  const rows = await sql`
    SELECT *
    FROM daily_top_picks
    WHERE pick_date = ${today}
    ORDER BY rank ASC
  `;

  return rows.map(mapRow);
}

export async function getDailyTopPickByTicker(ticker: string) {
  const today = getEdmontonDateString();

  const rows = await sql`
    SELECT *
    FROM daily_top_picks
    WHERE pick_date = ${today}
      AND LOWER(ticker) = LOWER(${ticker})
    LIMIT 1
  `;

  if (!rows.length) return null;

  return mapRow(rows[0]);
}