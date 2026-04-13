export default function HeroSection() {
    return (
      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto flex min-h-[78vh] max-w-7xl items-center px-6 py-20">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-zinc-400">
              Vision Terminal
            </p>
  
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              AI-Powered Investing,
              <br />
              Built for Modern Traders
            </h1>
  
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Vision Terminal is a modern investment intelligence platform designed
              to help users track their portfolio, monitor live market activity,
              explore AI-generated stock opportunities, and interact with a smart
              trading assistant — all in one streamlined terminal.
            </p>
  
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/pricing"
                className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                View Plans
              </a>
  
              <a
                href="/sign-in"
                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/5"
              >
                Enter Terminal
              </a>
            </div>
  
            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-white">Portfolio</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Track holdings, gains, losses, allocations, and portfolio health.
                </p>
              </div>
  
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-white">AI Picks</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Review daily AI-generated stock ideas with reasoning and trade
                  levels.
                </p>
              </div>
  
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-semibold text-white">Assistant</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Ask questions about your portfolio, stocks, and market strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }