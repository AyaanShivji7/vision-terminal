/**
 * Shared Finnhub client.
 *
 * Why this exists:
 *   The Finnhub free tier is capped at 60 requests/minute. Every terminal
 *   render previously triggered N+1 uncached fetches (portfolio holdings,
 *   watchlist items, news, market context), which burned through the
 *   quota quickly.
 *
 * What this does:
 *   1. Routes every call through a single module with strongly typed return
 *      shapes so callers can't accidentally re-introduce `cache: "no-store"`.
 *   2. Uses Next.js `fetch` cache (`next.revalidate`) so repeated calls to
 *      the same symbol within the window hit the Next.js data cache instead
 *      of Finnhub.
 *   3. Adds an in-memory in-flight dedupe map so concurrent identical
 *      requests (e.g. the same ticker appearing on a dashboard twice, or
 *      two panels rendering together) collapse to a single upstream call.
 *   4. Returns `null` / `[]` on failure instead of throwing, so UIs can
 *      degrade gracefully without falling over on a flaky third-party.
 */

const FINNHUB_BASE = "https://finnhub.io/api/v1";

// Cache windows (seconds). Quotes are intentionally short so the terminal
// still feels live without hammering the API on every render.
const QUOTE_REVALIDATE_SECONDS = 60;
const NEWS_REVALIDATE_SECONDS = 300;

export type Quote = {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
};

export type FinnhubNewsItem = {
  id: number | string;
  headline: string;
  url: string;
  source: string;
  datetime: number;
};

function getApiKey(): string | null {
  const apiKey = process.env.FINNHUB_API_KEY;
  return apiKey && apiKey.length > 0 ? apiKey : null;
}

// In-flight dedupe. Keyed by cache key; value is the Promise currently
// fetching that key. Cleared as soon as the promise settles so stale
// entries don't accumulate.
const inFlight = new Map<string, Promise<unknown>>();

async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Fetch a real-time quote for a single symbol.
 * Returns `null` for any failure (missing key, upstream error, invalid data)
 * so callers can choose how to degrade instead of having to wrap every call
 * in try/catch.
 */
export async function getQuote(symbol: string): Promise<Quote | null> {
  const ticker = symbol.trim().toUpperCase();

  if (!ticker) {
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("getQuote called but FINNHUB_API_KEY is not set");
    return null;
  }

  const cacheKey = `finnhub:quote:${ticker}`;

  return dedupe(cacheKey, async () => {
    try {
      const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(
        ticker
      )}&token=${apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: QUOTE_REVALIDATE_SECONDS },
      });

      if (!response.ok) {
        console.error(
          `Finnhub quote request failed for ${ticker}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();

      if (!data || typeof data.c !== "number" || data.c <= 0) {
        return null;
      }

      const quote: Quote = {
        symbol: ticker,
        currentPrice: Number(data.c),
        change: Number(data.d ?? 0),
        percentChange: Number(data.dp ?? 0),
        high: Number(data.h ?? 0),
        low: Number(data.l ?? 0),
        open: Number(data.o ?? 0),
        previousClose: Number(data.pc ?? 0),
      };

      return quote;
    } catch (error) {
      console.error(`Finnhub quote fetch threw for ${ticker}:`, error);
      return null;
    }
  });
}

/**
 * Fetch general market news. Returns `[]` on failure.
 */
export async function getNews(): Promise<FinnhubNewsItem[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("getNews called but FINNHUB_API_KEY is not set");
    return [];
  }

  const cacheKey = "finnhub:news:general";

  return dedupe(cacheKey, async () => {
    try {
      const url = `${FINNHUB_BASE}/news?category=general&token=${apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: NEWS_REVALIDATE_SECONDS },
      });

      if (!response.ok) {
        console.error(`Finnhub news request failed: ${response.status}`);
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any, index: number) => ({
        id: item.id ?? index,
        headline: String(item.headline ?? "Untitled article"),
        url: String(item.url ?? "#"),
        source: String(item.source ?? "Unknown"),
        datetime: Number(item.datetime ?? 0),
      }));
    } catch (error) {
      console.error("Finnhub news fetch threw:", error);
      return [];
    }
  });
}
