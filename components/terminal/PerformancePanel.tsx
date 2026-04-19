"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SignalPerformanceStats = {
  totalSignals: number;
  openSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  averageReturn: number;
};

type SignalHistoryItem = {
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

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function outcomeClass(outcome: string | null) {
  if (outcome === "win") return "text-green-400";
  if (outcome === "loss") return "text-red-400";
  return "text-yellow-300";
}

type PerformancePanelProps = {
  stats: SignalPerformanceStats;
  history: SignalHistoryItem[];
};

export default function PerformancePanel({
  stats,
  history,
}: PerformancePanelProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function handleRefreshSignals() {
    try {
      setRefreshing(true);
      setError("");

      const res = await fetch("/api/signals/refresh", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to refresh signals.");
      }

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to refresh signals.";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Performance Layer
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Signal Performance Dashboard
          </h2>
        </div>

        <button
          onClick={handleRefreshSignals}
          disabled={refreshing}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white hover:text-black disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh Signals"}
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Total Signals</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.totalSignals}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Open</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {stats.openSignals}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Wins</p>
          <p className="mt-2 text-2xl font-semibold text-green-400">
            {stats.wins}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Losses</p>
          <p className="mt-2 text-2xl font-semibold text-red-400">
            {stats.losses}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Win Rate</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatPercent(stats.winRate)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Avg Return</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              stats.averageReturn >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatPercent(stats.averageReturn)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
              <th className="px-4">Date</th>
              <th className="px-4">Ticker</th>
              <th className="px-4">Rank</th>
              <th className="px-4">Confidence</th>
              <th className="px-4">Entry</th>
              <th className="px-4">Current</th>
              <th className="px-4">Return</th>
              <th className="px-4">Outcome</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item) => (
              <tr
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/40 text-sm text-zinc-300"
              >
                <td className="rounded-l-2xl px-4 py-4">{item.pickDate}</td>
                <td className="px-4 py-4 font-semibold text-white">
                  {item.ticker}
                </td>
                <td className="px-4 py-4">{item.rank}</td>
                <td className="px-4 py-4">{item.confidenceScore ?? "N/A"}</td>
                <td className="px-4 py-4">{formatCurrency(item.entryPrice)}</td>
                <td className="px-4 py-4">{formatCurrency(item.currentPrice)}</td>
                <td
                  className={`px-4 py-4 font-semibold ${
                    (item.returnPercent ?? 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {item.returnPercent === null
                    ? "N/A"
                    : formatPercent(item.returnPercent)}
                </td>
                <td
                  className={`rounded-r-2xl px-4 py-4 font-semibold ${outcomeClass(
                    item.outcome
                  )}`}
                >
                  {item.outcome ?? "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}