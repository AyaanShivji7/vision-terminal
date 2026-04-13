import Link from "next/link";
import { getDailyTopPicks } from "@/lib/dailyTopPicks";

function riskClass(riskLevel: string | null) {
  if (riskLevel === "low") return "text-green-400";
  if (riskLevel === "high") return "text-red-400";
  return "text-yellow-300";
}

export default async function TopPicksPanel() {
  const picks = await getDailyTopPicks();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            AI Top 10
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Daily Stock Ideas
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          Updated Daily
        </div>
      </div>

      {picks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          No daily picks available yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 pb-2">
            {picks.map((pick) => (
              <Link
                key={pick.id}
                href={`/terminal/picks/${pick.ticker}`}
                className="block min-w-[280px] rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {pick.rank}. {pick.ticker}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {pick.shortReason}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        Confidence: {pick.confidenceScore ?? "N/A"}
                      </span>
                      <span
                        className={`rounded-full border border-white/10 px-3 py-1 ${riskClass(
                          pick.riskLevel
                        )}`}
                      >
                        Risk: {pick.riskLevel ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}