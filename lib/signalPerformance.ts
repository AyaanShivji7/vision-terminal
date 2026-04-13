import { sql } from "@/lib/db";

export type SignalPerformanceStats = {
  totalSignals: number;
  openSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  averageReturn: number;
};

export type SignalHistoryItem = {
  id: string;
  pickDate: string;
  ticker: string;
  rank: number;
  confidenceScore: number | null;
  riskLevel: string | null;
  signalStatus: string | null;
  outcome: string | null;
  entryPrice: number | null;
  currentPrice: number | null;
  returnPercent: number | null;
};

export async function getSignalPerformanceStats(): Promise<SignalPerformanceStats> {
  const rows = await sql`
    SELECT outcome, return_percent
    FROM daily_top_picks
  `;

  const totalSignals = rows.length;
  const openSignals = rows.filter((row: any) => row.outcome === "open").length;
  const wins = rows.filter((row: any) => row.outcome === "win").length;
  const losses = rows.filter((row: any) => row.outcome === "loss").length;

  const closedRows = rows.filter(
    (row: any) => row.return_percent !== null && row.outcome !== "open"
  );

  const averageReturn =
    closedRows.length > 0
      ? closedRows.reduce(
          (sum: number, row: any) => sum + Number(row.return_percent),
          0
        ) / closedRows.length
      : 0;

  const winRate =
    wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return {
    totalSignals,
    openSignals,
    wins,
    losses,
    winRate,
    averageReturn,
  };
}

export async function getRecentSignalHistory(limit = 20): Promise<SignalHistoryItem[]> {
  const rows = await sql`
    SELECT
      id,
      pick_date,
      ticker,
      rank,
      confidence_score,
      risk_level,
      signal_status,
      outcome,
      entry_price,
      current_price,
      return_percent
    FROM daily_top_picks
    ORDER BY pick_date DESC, rank ASC
    LIMIT ${limit}
  `;

  return rows.map((row: any) => ({
    id: row.id,
    pickDate: String(row.pick_date),
    ticker: row.ticker,
    rank: Number(row.rank),
    confidenceScore:
      row.confidence_score === null ? null : Number(row.confidence_score),
    riskLevel: row.risk_level ?? null,
    signalStatus: row.signal_status ?? null,
    outcome: row.outcome ?? null,
    entryPrice: row.entry_price === null ? null : Number(row.entry_price),
    currentPrice: row.current_price === null ? null : Number(row.current_price),
    returnPercent:
      row.return_percent === null ? null : Number(row.return_percent),
  }));
}