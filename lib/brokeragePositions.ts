import { sql } from "@/lib/db";

export type BrokeragePosition = {
  id: string;
  brokerageAccountId: string | null;
  snaptradeAccountId: string;
  symbol: string | null;
  description: string | null;
  quantity: number | null;
  marketValue: number | null;
  averagePurchasePrice: number | null;
  lastPrice: number | null;
  lastSyncedAt: string | null;
};

export async function getUserBrokeragePositions(clerkUserId: string) {
  const rows = await sql`
    SELECT
      id,
      brokerage_account_id,
      snaptrade_account_id,
      symbol,
      description,
      quantity,
      market_value,
      average_purchase_price,
      last_price,
      last_synced_at
    FROM brokerage_positions
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    brokerageAccountId: (row.brokerage_account_id as string | null) ?? null,
    snaptradeAccountId: row.snaptrade_account_id as string,
    symbol: (row.symbol as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    quantity: row.quantity === null ? null : Number(row.quantity),
    marketValue: row.market_value === null ? null : Number(row.market_value),
    averagePurchasePrice:
      row.average_purchase_price === null
        ? null
        : Number(row.average_purchase_price),
    lastPrice: row.last_price === null ? null : Number(row.last_price),
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
  })) as BrokeragePosition[];
}