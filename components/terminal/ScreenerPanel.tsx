"use client";

import { useMemo, useState } from "react";

type TimeframeData = {
  prices: number[];
  change: string;
  high: string;
  low: string;
  open: string;
};

type StockData = {
  ticker: string;
  name: string;
  basePrice: number;
  timeframes: Record<string, TimeframeData>;
};

const generateChartPath = (prices: number[]) => {
  const max = Math.max(...prices);
  const min = Math.min(...prices);

  return prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * 100;
      const y = 100 - ((price - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
};

const stockDatabase: StockData[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    basePrice: 214,
    timeframes: {
      "1D": {
        prices: [210, 212, 211, 213, 214, 213, 214],
        change: "+1.84%",
        high: "215.20",
        low: "209.80",
        open: "210.00",
      },
      "1M": {
        prices: [198, 202, 205, 207, 210, 212, 214],
        change: "+8.12%",
        high: "216.00",
        low: "195.20",
        open: "198.00",
      },
    },
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    basePrice: 129,
    timeframes: {
      "1D": {
        prices: [124, 126, 127, 128, 129, 128, 129],
        change: "+3.21%",
        high: "130.10",
        low: "123.80",
        open: "124.00",
      },
      "1M": {
        prices: [110, 115, 118, 122, 125, 128, 129],
        change: "+17.27%",
        high: "130.50",
        low: "108.20",
        open: "110.00",
      },
    },
  },
];

export default function ScreenerPanel() {
  const [search, setSearch] = useState("");
  const [ticker, setTicker] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1D");

  const stock = useMemo(() => {
    return stockDatabase.find((s) => s.ticker === ticker) || stockDatabase[0];
  }, [ticker]);

  const data = stock.timeframes[timeframe] || stock.timeframes["1D"];

  const chartPath = generateChartPath(data.prices);

  function handleSearch() {
    const input = search.toUpperCase();
    const found = stockDatabase.find((s) => s.ticker === input);
    if (found) setTicker(found.ticker);
    setSearch("");
  }

  return (
    <section className="h-full rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Stock Screener
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Market Search & Chart View
        </h2>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
        />
        <button
          onClick={handleSearch}
          className="rounded-xl bg-white px-4 py-3 text-black"
        >
          Search
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{stock.ticker}</p>
          <p className="text-sm text-zinc-400">{stock.name}</p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold">${stock.basePrice}</p>
          <p
            className={
              data.change.includes("-") ? "text-red-400" : "text-green-400"
            }
          >
            {timeframe} {data.change}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {["1D", "1M"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`rounded-full px-3 py-1 ${
              timeframe === tf
                ? "bg-white text-black"
                : "bg-black text-white border border-white/10"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="mt-5 h-[300px] w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <polyline
            fill="none"
            stroke="white"
            strokeWidth="2"
            points={chartPath}
          />
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">High</p>
          <p className="text-white">{data.high}</p>
        </div>
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">Low</p>
          <p className="text-white">{data.low}</p>
        </div>
        <div className="rounded-xl bg-black/40 p-3">
          <p className="text-zinc-400">Open</p>
          <p className="text-white">{data.open}</p>
        </div>
      </div>
    </section>
  );
}