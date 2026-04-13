"use client";

import { useEffect, useState } from "react";

type WatchlistItem = {
  id: string;
  ticker: string;
  currentPrice: number | null;
  percentChange: number | null;
  signalLabel: string;
};

type Watchlist = {
  id: string;
  name: string;
  items: WatchlistItem[];
};

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function signalClass(label: string) {
  if (label === "strong move up") return "text-green-400";
  if (label === "high momentum") return "text-green-300";
  if (label === "sharp drop") return "text-red-400";
  if (label === "pullback") return "text-yellow-300";
  return "text-zinc-300";
}

export default function WatchlistsPanel() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistName, setWatchlistName] = useState("");
  const [tickerInputs, setTickerInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadWatchlists() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/watchlists");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load watchlists.");
      }

      setWatchlists(data.watchlists || []);
    } catch (err: any) {
      setError(err.message || "Failed to load watchlists.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlists();
  }, []);

  async function createWatchlist() {
    try {
      if (!watchlistName.trim()) {
        setError("Please enter a watchlist name.");
        return;
      }

      setSaving(true);
      setError("");

      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: watchlistName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create watchlist.");
      }

      setWatchlistName("");
      await loadWatchlists();
    } catch (err: any) {
      setError(err.message || "Failed to create watchlist.");
    } finally {
      setSaving(false);
    }
  }

  async function addTicker(watchlistId: string) {
    try {
      const ticker = (tickerInputs[watchlistId] || "").trim().toUpperCase();

      if (!ticker) {
        setError("Please enter a ticker.");
        return;
      }

      setError("");

      const res = await fetch(`/api/watchlists/${watchlistId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add ticker.");
      }

      setTickerInputs((prev) => ({
        ...prev,
        [watchlistId]: "",
      }));

      await loadWatchlists();
    } catch (err: any) {
      setError(err.message || "Failed to add ticker.");
    }
  }

  async function deleteWatchlist(watchlistId: string) {
    try {
      setError("");

      const res = await fetch(`/api/watchlists/${watchlistId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete watchlist.");
      }

      await loadWatchlists();
    } catch (err: any) {
      setError(err.message || "Failed to delete watchlist.");
    }
  }

  async function deleteItem(itemId: string) {
    try {
      setError("");

      const res = await fetch(`/api/watchlist-items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete watchlist item.");
      }

      await loadWatchlists();
    } catch (err: any) {
      setError(err.message || "Failed to delete watchlist item.");
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Smart Watchlists
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            AI-Monitored Watchlist Signals
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          Watchlist Layer
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          placeholder="Create new watchlist"
          className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
        />
        <button
          onClick={createWatchlist}
          disabled={saving}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create Watchlist"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          Create watchlists and track AI-style monitoring labels based on live price movement.
        </p>
      )}

      <div className="mt-6 space-y-5">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
            Loading watchlists...
          </div>
        ) : watchlists.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
            No watchlists created yet.
          </div>
        ) : (
          watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xl font-semibold text-white">
                    {watchlist.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {watchlist.items.length} tracked ticker
                    {watchlist.items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  onClick={() => deleteWatchlist(watchlist.id)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-white transition hover:bg-white hover:text-black"
                >
                  Delete Watchlist
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  value={tickerInputs[watchlist.id] || ""}
                  onChange={(e) =>
                    setTickerInputs((prev) => ({
                      ...prev,
                      [watchlist.id]: e.target.value,
                    }))
                  }
                  placeholder="Add ticker"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={() => addTicker(watchlist.id)}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
                >
                  Add
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {watchlist.items.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">
                    No tickers in this watchlist yet.
                  </div>
                ) : (
                  watchlist.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {item.ticker}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm">
                            <span className="text-zinc-300">
                              {formatCurrency(item.currentPrice)}
                            </span>
                            <span
                              className={
                                (item.percentChange ?? 0) >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {formatPercent(item.percentChange)}
                            </span>
                            <span className={signalClass(item.signalLabel)}>
                              {item.signalLabel}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="rounded-xl border border-white/10 px-4 py-2 text-white transition hover:bg-white hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}