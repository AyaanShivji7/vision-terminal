export default function AboutSection() {
    return (
      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
              About the Company
            </p>
  
            <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">
              A simplified terminal experience for public investors
            </h2>
  
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Vision Terminal is being built to make advanced investment tools more
              accessible to everyday investors and active traders. Instead of
              relying on multiple disconnected platforms for charting, portfolio
              analysis, stock ideas, and market research, users can access
              everything through one centralized terminal experience.
            </p>
  
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              The platform combines market data, portfolio tracking, AI-generated
              stock recommendations, and an embedded trading assistant into a
              streamlined interface designed for speed, clarity, and daily use.
              The goal is to deliver a premium investing workflow without the
              complexity or cost of institutional-grade terminals.
            </p>
          </div>
  
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Live Market View</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Monitor market headlines, review chart activity, and analyze stocks
                from a centralized dashboard experience.
              </p>
            </div>
  
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Personalized Insights</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                View stock recommendations and portfolio guidance shaped around your
                own holdings, behavior, and trading goals.
              </p>
            </div>
  
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Built for Action</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Designed for users who want quick visibility into their positions,
                trade ideas, and next possible moves without information overload.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }