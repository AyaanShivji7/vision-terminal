import { sql } from "@/lib/db";
import { getQuote } from "@/lib/finnhub";

export type WatchlistItem = {
  id: string;
  ticker: string;
  currentPrice: number | null;
  percentChange: number | null;
  signalLabel: string;
};

export type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
};

function getSignalLabel(percentChange: number | null) {
  if (percentChange === null) return "watch closely";
  if (percentChange >= 4) return "strong move up";
  if (percentChange >= 2) return "high momentum";
  if (percentChange <= -4) return "sharp drop";
  if (percentChange <= -2) return "pullback";
  return "watch closely";
}

export async function getUserWatchlists(clerkUserId: string): Promise<Watchlist[]> {
  const watchlists = await sql`
    SELECT id, name
    FROM watchlists
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;

  const result: Watchlist[] = [];

  for (const watchlist of watchlists) {
    const items = await sql`
      SELECT id, ticker
      FROM watchlist_items
      WHERE watchlist_id = ${watchlist.id}
      ORDER BY created_at DESC
    `;

    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const quote = await getQuote(item.ticker);

        const currentPrice = quote ? quote.currentPrice : null;
        const percentChange = quote ? quote.percentChange : null;

        return {
          id: item.id,
          ticker: item.ticker,
          currentPrice,
          percentChange,
          signalLabel: getSignalLabel(percentChange),
        };
      })
    );

    result.push({
      id: watchlist.id,
      name: watchlist.name,
      items: enrichedItems,
    });
  }

  return result;
}
