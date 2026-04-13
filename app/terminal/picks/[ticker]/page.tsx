import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyTopPickByTicker } from "@/lib/dailyTopPicks";

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

function riskClass(riskLevel: string | null) {
  if (riskLevel === "low") return "text-green-400";
  if (riskLevel === "high") return "text-red-400";
  return "text-yellow-300";
}

export default async function PickDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  const pick = await getDailyTopPickByTicker(ticker);

  if (!pick) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
              AI Stock Detail
            </p>
            <h1 className="mt-2 text-4xl font-bold text-white">
              {pick.ticker}
            </h1>
            <p className="mt-2 text-lg text-zinc-400">{pick.company}</p>
          </div>

          <Link
            href="/terminal"
            className="rounded-full border border-white px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black"
          >
            Back to Terminal
          </Link>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-4">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Confidence
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {pick.confidenceScore ?? "N/A"}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Risk Level
              </p>
              <p className={`mt-4 text-2xl font-semibold ${riskClass(pick.riskLevel)}`}>
                {pick.riskLevel ?? "N/A"}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Signal Status
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {pick.signalStatus ?? "N/A"}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Return %
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatPercent(pick.returnPercent)}
              </p>
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Entry Price
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatCurrency(pick.entryPrice)}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Current Price
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatCurrency(pick.currentPrice)}
              </p>
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
              Summary
            </p>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              {pick.summary}
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-3">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Buy Zone
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {pick.buyZone}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Take Profit
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {pick.takeProfit}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                Stop Loss
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {pick.stopLoss}
              </p>
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
              Why This Stock Was Recommended
            </p>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              {pick.reasoning}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}