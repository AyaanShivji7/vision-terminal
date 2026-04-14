import { auth } from "@clerk/nextjs/server";
import { getActivePortfolioSnapshot } from "@/lib/portfolioContext";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function PortfolioIntelligencePanel() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Portfolio Intelligence
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Exposure, Risk, and Rebalancing Insights
            </h2>
          </div>

          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            Advisor Layer
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          Sign in to view portfolio intelligence.
        </div>
      </section>
    );
  }

  const snapshot = await getActivePortfolioSnapshot(userId);
  const { source, holdings, intelligence } = snapshot;
  const sourceLabel =
    source === "brokerage"
      ? "Source: Linked Brokerage Holdings"
      : "Source: Manual Portfolio";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Portfolio Intelligence
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Exposure, Risk, and Rebalancing Insights
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          {sourceLabel}
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          {source === "brokerage"
            ? "No usable linked brokerage holdings found yet."
            : "Add portfolio holdings to unlock portfolio intelligence."}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-zinc-500">Portfolio Value</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatCurrency(intelligence.totalValue)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-zinc-500">Top 3 Concentration</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {intelligence.concentrationPercent}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-zinc-500">Diversification Score</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {intelligence.diversificationScore}/100
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Sector Exposure
              </p>

              <div className="mt-4 space-y-3">
                {intelligence.sectorExposure.map((sector) => (
                  <div key={sector.sector}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-white">{sector.sector}</span>
                      <span className="text-zinc-400">
                        {sector.weightPercent}% · {formatCurrency(sector.value)}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${Math.min(sector.weightPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Portfolio Commentary
              </p>

              <p className="mt-4 text-base leading-7 text-zinc-300">
                {intelligence.commentary}
              </p>

              <div className="mt-5 grid gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-400">Warnings</p>
                  {intelligence.warnings.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">No major warnings.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                      {intelligence.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-400">Strengths</p>
                  {intelligence.strengths.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">No major strengths identified yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                      {intelligence.strengths.map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-yellow-300">Suggestions</p>
                  {intelligence.suggestions.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">No rebalance suggestions right now.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                      {intelligence.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
