"use client";

import { useEffect, useMemo, useState } from "react";

type Holding = {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
};
type PortfolioSource = "brokerage" | "manual";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function PortfolioPanel() {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [source, setSource] = useState<PortfolioSource>("manual");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPortfolio() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/portfolio");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load portfolio");
      }

      setHoldings(data.holdings || []);
      setSource(data.source === "brokerage" ? "brokerage" : "manual");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load portfolio."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  const totals = useMemo(() => {
    const totalInvested = holdings.reduce(
      (sum, holding) => sum + holding.shares * holding.buyPrice,
      0
    );

    const totalCurrentValue = holdings.reduce(
      (sum, holding) => sum + holding.shares * holding.currentPrice,
      0
    );

    const gainLossDollar = totalCurrentValue - totalInvested;
    const gainLossPercent =
      totalInvested > 0 ? (gainLossDollar / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      gainLossDollar,
      gainLossPercent,
    };
  }, [holdings]);

  async function addHolding() {
    if (source === "brokerage") {
      setError(
        "Manual add is disabled while linked brokerage holdings are active."
      );
      return;
    }

    const cleanedTicker = ticker.trim().toUpperCase();
    const parsedShares = Number(shares);
    const parsedBuyPrice = Number(buyPrice);

    if (!cleanedTicker) {
      setError("Please enter a ticker.");
      return;
    }

    if (!parsedShares || parsedShares <= 0) {
      setError("Please enter a valid share amount.");
      return;
    }

    if (!parsedBuyPrice || parsedBuyPrice <= 0) {
      setError("Please enter a valid buy price.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: cleanedTicker,
          shares: parsedShares,
          buyPrice: parsedBuyPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save holding.");
      }

      setHoldings((prev) => [data.holding, ...prev]);
      setTicker("");
      setShares("");
      setBuyPrice("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save holding."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteHolding(id: string) {
    if (source === "brokerage") {
      setError(
        "Manual delete is disabled while linked brokerage holdings are active."
      );
      return;
    }

    try {
      setError("");

      const res = await fetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete holding.");
      }

      setHoldings((prev) => prev.filter((holding) => holding.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete holding."));
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Portfolio Tracker
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Saved Holdings
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          {source === "brokerage"
            ? "Source: Linked Brokerage Holdings"
            : "Source: Manual Portfolio"}
        </div>
      </div>

      {source === "manual" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Ticker"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
          />

          <input
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Shares"
            type="number"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
          />

          <input
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="Buy Price"
            type="number"
            step="0.01"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-zinc-500"
          />

          <button
            onClick={addHolding}
            disabled={saving}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Holding"}
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
          Linked brokerage holdings are active. Manual add/delete controls are
          hidden until no usable brokerage positions are synced.
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          {source === "brokerage"
            ? "Displaying imported linked brokerage holdings."
            : "Holdings use live Finnhub pricing when saved and when the portfolio reloads."}
        </p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Total Invested</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatCurrency(totals.totalInvested)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Current Value</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatCurrency(totals.totalCurrentValue)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Gain / Loss</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              totals.gainLossDollar >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(totals.gainLossDollar)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-sm text-zinc-500">Return %</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              totals.gainLossPercent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatPercent(totals.gainLossPercent)}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
            Loading portfolio...
          </div>
        ) : holdings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
            No holdings added yet.
          </div>
        ) : (
          holdings.map((holding) => {
            const invested = holding.shares * holding.buyPrice;
            const currentValue = holding.shares * holding.currentPrice;
            const pnlDollar = currentValue - invested;
            const pnlPercent = invested > 0 ? (pnlDollar / invested) * 100 : 0;

            return (
              <div
                key={holding.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {holding.ticker}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {holding.shares} shares
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm text-zinc-400 md:grid-cols-5 md:text-right">
                    <div>
                      <p>Buy Price</p>
                      <p className="mt-1 text-white">
                        {formatCurrency(holding.buyPrice)}
                      </p>
                    </div>

                    <div>
                      <p>Current Price</p>
                      <p className="mt-1 text-white">
                        {formatCurrency(holding.currentPrice)}
                      </p>
                    </div>

                    <div>
                      <p>Invested</p>
                      <p className="mt-1 text-white">
                        {formatCurrency(invested)}
                      </p>
                    </div>

                    <div>
                      <p>P/L</p>
                      <p
                        className={`mt-1 font-semibold ${
                          pnlDollar >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(pnlDollar)} ({formatPercent(pnlPercent)})
                      </p>
                    </div>

                    <div className="md:pl-4">
                      {source === "manual" ? (
                        <button
                          onClick={() => deleteHolding(holding.id)}
                          className="rounded-xl border border-white/10 px-4 py-2 text-white transition hover:bg-white hover:text-black"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">Imported</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
