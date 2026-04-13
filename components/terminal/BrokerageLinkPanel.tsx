"use client";

import { useState } from "react";

export default function BrokerageLinkPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLinkBrokerage() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/brokerage/link", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create brokerage link.");
      }

      if (!data.redirectUri) {
        throw new Error("No redirect URI returned.");
      }

      window.location.href = data.redirectUri;
    } catch (err: any) {
      setError(err.message || "Failed to link brokerage.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Brokerage Linking
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Connect Your Brokerage Account
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          Read-Only
        </div>
      </div>

      <p className="max-w-3xl text-sm leading-7 text-zinc-400">
        Link a supported brokerage account so Vision Terminal can later import your
        real holdings automatically instead of requiring manual portfolio entry.
      </p>

      <div className="mt-5">
        <button
          onClick={handleLinkBrokerage}
          disabled={loading}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {loading ? "Preparing Link..." : "Link Brokerage Account"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}