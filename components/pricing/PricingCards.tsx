export default function PricingCards() {
    return (
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
              Pricing
            </p>
            <h2 className="mt-4 text-4xl font-bold text-white md:text-6xl">
              Choose the terminal access that fits your trading style
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Vision Terminal is built for investors who want a cleaner, smarter,
              and more AI-powered way to track markets, analyze portfolios, and
              discover opportunities.
            </p>
          </div>
  
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
                    Basic Premium
                  </p>
                  <h3 className="mt-3 text-3xl font-bold text-white">
                    For active investors
                  </h3>
                </div>
  
                <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                  Most Accessible
                </div>
              </div>
  
              <div className="mt-8">
                <p className="text-5xl font-bold text-white">$19</p>
                <p className="mt-2 text-zinc-400">per month</p>
              </div>
  
              <p className="mt-8 text-base leading-7 text-zinc-400">
                A strong starting plan for users who want portfolio visibility,
                market awareness, AI-powered stock ideas, and an embedded trading
                assistant inside one clean terminal.
              </p>
  
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Portfolio tracking dashboard
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Live stock search and screener access
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Daily AI-generated top stock list
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Standard Day-Trader AI chatbot access
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Market news feed and article links
                </div>
              </div>
  
              <a
                href="/sign-in"
                className="mt-10 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Get Basic Premium
              </a>
            </div>
  
            <div className="rounded-3xl border border-white bg-white p-8 text-black">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-600">
                    Day-Trader Pro
                  </p>
                  <h3 className="mt-3 text-3xl font-bold">
                    For serious day traders
                  </h3>
                </div>
  
                <div className="rounded-full border border-black/10 px-4 py-2 text-sm text-zinc-700">
                  Premium Tier
                </div>
              </div>
  
              <div className="mt-8">
                <p className="text-5xl font-bold">$49</p>
                <p className="mt-2 text-zinc-600">per month</p>
              </div>
  
              <p className="mt-8 text-base leading-7 text-zinc-700">
                Built for heavier users who want deeper AI support, stronger market
                awareness, more decision guidance, and a more advanced terminal
                experience for faster daily trading workflows.
              </p>
  
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-zinc-800">
                  Everything in Basic Premium
                </div>
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-zinc-800">
                  Enhanced Day-Trader Pro AI chatbot
                </div>
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-zinc-800">
                  More advanced stock recommendation depth
                </div>
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-zinc-800">
                  More detailed trade reasoning and planning
                </div>
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-zinc-800">
                  Priority access to future premium features
                </div>
              </div>
  
              <a
                href="/sign-in"
                className="mt-10 inline-flex rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-zinc-800"
              >
                Get Day-Trader Pro
              </a>
            </div>
          </div>
  
          <div className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
                  What’s included
                </p>
                <h3 className="mt-4 text-3xl font-bold text-white">
                  Built as one unified investing workflow
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
                  Instead of using separate tools for charting, portfolio tracking,
                  stock discovery, and AI support, Vision Terminal is designed to
                  bring the full workflow into one premium interface.
                </p>
              </div>
  
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Portfolio monitoring
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  News awareness
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  Stock discovery
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-zinc-300">
                  AI market guidance
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }