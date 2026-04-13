export default function ContactSection() {
    return (
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
                Contact
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">
                Get in touch with Vision Terminal
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
                For product inquiries, partnerships, support, or early access
                opportunities, contact the Vision Terminal team.
              </p>
            </div>
  
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Company
                  </p>
                  <p className="mt-2 text-lg text-white">Vision Terminal</p>
                </div>
  
                <div>
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Email
                  </p>
                  <p className="mt-2 text-lg text-white">contact@visionterminal.com</p>
                </div>
  
                <div>
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Product
                  </p>
                  <p className="mt-2 text-lg text-white">
                    AI-Powered Investment Intelligence Platform
                  </p>
                </div>
  
                <div>
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Availability
                  </p>
                  <p className="mt-2 text-lg text-white">
                    Subscription access launching soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }