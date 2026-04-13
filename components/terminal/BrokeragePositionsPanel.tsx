"use client";

import { useEffect, useState } from "react";

type BrokeragePosition = {
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

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BrokeragePositionsPanel() {
  const [positions, setPositions] = useState<BrokeragePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function loadPositions() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/brokerage/local-positions");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load brokerage positions.");
      }

      setPositions(data.positions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load brokerage positions.");
    } finally {
      setLoading(false);
    }
  }

  async function syncPositions() {
    try {
      setSyncing(true);
      setError("");

      const res = await fetch("/api/brokerage/sync-positions", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync brokerage positions.");
      }

      await loadPositions();
    } catch (err: any) {
      setError(err.message || "Failed to sync brokerage positions.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadPositions();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Brokerage Positions
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Imported Holdings from Linked Accounts
          </h2>
        </div>

        <button
          onClick={syncPositions}
          disabled={syncing}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "Sync Positions"}
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">
          Pull holdings from linked brokerage accounts into Vision Terminal.
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          Loading brokerage positions...
        </div>
      ) : positions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          No brokerage positions synced yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="px-4">Symbol</th>
                <th className="px-4">Description</th>
                <th className="px-4">Quantity</th>
                <th className="px-4">Avg Cost</th>
                <th className="px-4">Last Price</th>
                <th className="px-4">Market Value</th>
              </tr>
            </thead>

            <tbody>
              {positions.map((position) => (
                <tr
                  key={position.id}
                  className="rounded-2xl border border-white/10 bg-black/40 text-sm text-zinc-300"
                >
                  <td className="rounded-l-2xl px-4 py-4 font-semibold text-white">
                    {position.symbol ?? "N/A"}
                  </td>
                  <td className="px-4 py-4">
                    {position.description ?? "N/A"}
                  </td>
                  <td className="px-4 py-4">
                    {position.quantity ?? "N/A"}
                  </td>
                  <td className="px-4 py-4">
                    {formatCurrency(position.averagePurchasePrice)}
                  </td>
                  <td className="px-4 py-4">
                    {formatCurrency(position.lastPrice)}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    {formatCurrency(position.marketValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}