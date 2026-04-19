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
const CANDLE_REVALIDATE_SECONDS = 300;
const SEARCH_REVALIDATE_SECONDS = 3600;

export type Resolution = "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";

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

export type Candle = {
  timestamp: number; // seconds since epoch
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SymbolMatch = {
  symbol: string;
  description: string;
  type: string;
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

/**
 * Fetch OHLC candles for a symbol. Returns `[]` on failure or when the
 * upstream reports `no_data`. Note: Finnhub may restrict the candles
 * endpoint on the free tier; callers should degrade gracefully when the
 * array is empty.
 */
export async function getCandles(
  symbol: string,
  resolution: Resolution,
  fromSeconds: number,
  toSeconds: number
): Promise<Candle[]> {
  const ticker = symbol.trim().toUpperCase();

  if (!ticker || !Number.isFinite(fromSeconds) || !Number.isFinite(toSeconds)) {
    return [];
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("getCandles called but FINNHUB_API_KEY is not set");
    return [];
  }

  const from = Math.floor(fromSeconds);
  const to = Math.floor(toSeconds);
  const cacheKey = `finnhub:candles:${ticker}:${resolution}:${from}:${to}`;

  return dedupe(cacheKey, async () => {
    try {
      const url = `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(
        ticker
      )}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: CANDLE_REVALIDATE_SECONDS },
      });

      if (!response.ok) {
        console.error(
          `Finnhub candles request failed for ${ticker}: ${response.status}`
        );
        return [];
      }

      const data = await response.json();

      if (!data || data.s !== "ok" || !Array.isArray(data.t)) {
        return [];
      }

      const length: number = data.t.length;
      const candles: Candle[] = [];

      for (let i = 0; i < length; i++) {
        candles.push({
          timestamp: Number(data.t[i]),
          open: Number(data.o[i]),
          high: Number(data.h[i]),
          low: Number(data.l[i]),
          close: Number(data.c[i]),
          volume: Number(data.v[i] ?? 0),
        });
      }

      return candles;
    } catch (error) {
      console.error(`Finnhub candles fetch threw for ${ticker}:`, error);
      return [];
    }
  });
}

/**
 * Finnhub symbol search. Returns `[]` on failure.
 */
export async function searchSymbols(query: string): Promise<SymbolMatch[]> {
  const q = query.trim();

  if (q.length < 1) {
    return [];
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const cacheKey = `finnhub:search:${q.toLowerCase()}`;

  return dedupe(cacheKey, async () => {
    try {
      const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(
        q
      )}&token=${apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: SEARCH_REVALIDATE_SECONDS },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.result)) {
        return [];
      }

      return data.result
        .slice(0, 10)
        .map((item: any): SymbolMatch => ({
          symbol: String(item.symbol ?? "").toUpperCase(),
          description: String(item.description ?? ""),
          type: String(item.type ?? ""),
        }))
        .filter((item: SymbolMatch) => item.symbol.length > 0);
    } catch (error) {
      console.error("Finnhub search fetch threw:", error);
      return [];
    }
  });
}
