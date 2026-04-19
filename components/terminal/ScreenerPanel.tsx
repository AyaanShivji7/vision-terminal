"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { POPULAR_TICKERS } from "@/data/popularTickers";

type Timeframe = {
  label: string;
  resolution: "5" | "15" | "30" | "60" | "D" | "W";
  days: number;
};

const TIMEFRAMES: Timeframe[] = [
  { label: "1D", resolution: "15", days: 1 },
  { label: "5D", resolution: "60", days: 5 },
  { label: "1M", resolution: "D", days: 30 },
  { label: "6M", resolution: "D", days: 180 },
  { label: "1Y", resolution: "D", days: 365 },
];

type Quote = {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
};

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type SymbolMatch = {
  symbol: string;
  description: string;
  type: string;
};

function generateChartPath(prices: number[]): string {
  if (prices.length < 2) return "";

  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  return prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * 100;
      const y = 100 - ((price - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export default function ScreenerPanel() {
  const [ticker, setTicker] = useState("AAPL");
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[2]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<SymbolMatch[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  // Load quote + candles whenever ticker or timeframe changes.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [quoteRes, candlesRes] = await Promise.all([
          fetch(`/api/quote?symbol=${encodeURIComponent(ticker)}`),
          fetch(
            `/api/candles?symbol=${encodeURIComponent(ticker)}&resolution=${
              timeframe.resolution
            }&days=${timeframe.days}`
          ),
        ]);

        if (cancelled) return;

        const quoteData = quoteRes.ok ? await quoteRes.json() : null;
        const candlesData = candlesRes.ok ? await candlesRes.json() : null;

        if (quoteData && !quoteData.error) {
          setQuote(quoteData as Quote);
        } else {
          setQuote(null);
        }

        const loadedCandles: Candle[] = Array.isArray(candlesData?.candles)
          ? candlesData.candles
          : [];
        setCandles(loadedCandles);

        if (!quoteData || quoteData.error) {
          setError("Quote unavailable for this symbol.");
        } else if (loadedCandles.length === 0) {
          // Candle endpoint often fails on the Finnhub free tier. Don't
          // surface this as a hard error — the quote and stats still render.
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Screener load error:", err);
          setError("Something went wrong loading this symbol.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ticker, timeframe]);

  // Close the autocomplete dropdown when clicking outside.
  useEffect(() => {
    function handler(event: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowMatches(false);
      }
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete: Finnhub first, popular-ticker fallback.
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const q = search.trim();

    if (q.length < 1) {
      setMatches(popularMatchesFor(""));
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/symbols/search?q=${encodeURIComponent(q)}`
        );

        if (!res.ok) {
          setMatches(popularMatchesFor(q));
          return;
        }

        const data = await res.json();
        const apiMatches: SymbolMatch[] = Array.isArray(data?.matches)
          ? data.matches
          : [];

        if (apiMatches.length === 0) {
          setMatches(popularMatchesFor(q));
        } else {
          setMatches(apiMatches);
        }
      } catch {
        setMatches(popularMatchesFor(q));
      }
    }, 200);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const chartPath = generateChartPath(closes);

  // Prefer live quote values; fall back to candle-derived stats if quote is
  // missing (e.g. after-hours or partial failure).
  const percentChange = quote?.percentChange ?? null;
  const basePrice = quote?.currentPrice ?? closes[closes.length - 1] ?? null;
  const high = quote?.high ?? (candles.length ? Math.max(...candles.map((c) => c.high)) : null);
  const low = quote?.low ?? (candles.length ? Math.min(...candles.map((c) => c.low)) : null);
  const open = quote?.open ?? candles[0]?.open ?? null;

  function applySymbol(nextSymbol: string) {
    const clean = nextSymbol.trim().toUpperCase();
    if (!clean) return;
    setTicker(clean);
    setSearch("");
    setShowMatches(false);
  }

  function handleSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const primary = matches[0]?.symbol || search;
      applySymbol(primary);
    } else if (event.key === "Escape") {
      setShowMatches(false);
    }
  }

  const changeIsNegative =
    typeof percentChange === "number" && percentChange < 0;

  return (
    <section className="h-full rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Stock Screener
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Live Market Search & Chart
        </h2>
      </div>

      <div className="relative" ref={searchWrapperRef}>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowMatches(true);
            }}
            onFocus={() => setShowMatches(true)}
            onKeyDown={handleSearchKey}
            placeholder="Search ticker or company (e.g. AAPL, Nvidia)"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
          />
          <button
            onClick={() => applySymbol(matches[0]?.symbol || search)}
            className="rounded-xl bg-white px-4 py-3 text-black"
          >
            Search
          </button>
        </div>

        {showMatches && matches.length > 0 && (
          <ul className="absolute left-0 right-0 z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/95 shadow-xl">
            {matches.map((match) => (
              <li key={`${match.symbol}-${match.description}`}>
                <button
                  onClick={() => applySymbol(match.symbol)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                >
                  <span className="font-semibold">{match.symbol}</span>
                  <span className="ml-3 truncate text-xs text-zinc-400">
                    {match.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{ticker}</p>
          <p className="text-sm text-zinc-400">
            {POPULAR_TICKERS.find((t) => t.symbol === ticker)?.name ?? ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold">{formatUsd(basePrice)}</p>
          {typeof percentChange === "number" ? (
            <p className={changeIsNegative ? "text-red-400" : "text-green-400"}>
              {timeframe.label} {changeIsNegative ? "" : "+"}
              {percentChange.toFixed(2)}%
            </p>
          ) : (
            <p className="text-zinc-500">{timeframe.label} —</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => setTimeframe(tf)}
            className={`rounded-full px-3 py-1 text-sm ${
              timeframe.label === tf.label
                ? "bg-white text-black"
                : "border border-white/10 bg-black text-white"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="mt-5 h-[300px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading…
          </div>
        ) : chartPath ? (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <polyline
              fill="none"
              stroke={changeIsNegative ? "#f87171" : "#4ade80"}
              strokeWidth="0.8"
              points={chartPath}
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Chart data unavailable on this tier — quote stats shown below.
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-400">{error}</p>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">High</p>
          <p className="text-white">{formatUsd(high)}</p>
        </div>
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">Low</p>
          <p className="text-white">{formatUsd(low)}</p>
        </div>
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">Open</p>
          <p className="text-white">{formatUsd(open)}</p>
        </div>
      </div>
    </section>
  );
}

function popularMatchesFor(query: string): SymbolMatch[] {
  const q = query.trim().toLowerCase();

  const filtered = q
    ? POPULAR_TICKERS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      )
    : POPULAR_TICKERS.slice(0, 10);

  return filtered.slice(0, 10).map((t) => ({
    symbol: t.symbol,
    description: t.name,
    type: "Common Stock",
  }));
}
