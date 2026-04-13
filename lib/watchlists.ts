import { sql } from "@/lib/db";

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

async function fetchLiveQuote(ticker: string) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${ticker}`);
  }

  const data = await response.json();

  if (!data || typeof data.c !== "number" || data.c <= 0) {
    return {
      currentPrice: null,
      percentChange: null,
    };
  }

  return {
    currentPrice: Number(data.c),
    percentChange: Number(data.dp ?? 0),
  };
}

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
        try {
          const quote = await fetchLiveQuote(item.ticker);

          return {
            id: item.id,
            ticker: item.ticker,
            currentPrice: quote.currentPrice,
            percentChange: quote.percentChange,
            signalLabel: getSignalLabel(quote.percentChange),
          };
        } catch {
          return {
            id: item.id,
            ticker: item.ticker,
            currentPrice: null,
            percentChange: null,
            signalLabel: "watch closely",
          };
        }
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