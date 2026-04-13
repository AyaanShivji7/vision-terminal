"use client";

import { useEffect, useState } from "react";

type BrokerageConnection = {
  id: string;
  authorizationId: string;
  brokerageName: string | null;
  brokerageSlug: string | null;
  connectionStatus: string | null;
  disabled: boolean;
};

type BrokerageAccount = {
  id: string;
  brokerageConnectionId: string | null;
  snaptradeAccountId: string;
  accountName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  lastSyncedAt: string | null;
};

export default function BrokerageAccountsPanel() {
  const [connections, setConnections] = useState<BrokerageConnection[]>([]);
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function loadLocalData() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/brokerage/local");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load brokerage data.");
      }

      setConnections(data.connections || []);
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load brokerage data.");
    } finally {
      setLoading(false);
    }
  }

  async function syncBrokerageAccounts() {
    try {
      setSyncing(true);
      setError("");

      const res = await fetch("/api/brokerage/sync", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync brokerage accounts.");
      }

      await loadLocalData();
    } catch (err: any) {
      setError(err.message || "Failed to sync brokerage accounts.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadLocalData();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Linked Brokerage Accounts
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Synced Connections and Accounts
          </h2>
        </div>

        <button
          onClick={syncBrokerageAccounts}
          disabled={syncing}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "Sync Accounts"}
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">
          Sync your linked brokerages to pull account metadata into Vision Terminal.
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
          Loading brokerage data...
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
              Connections
            </p>

            {connections.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
                No brokerage connections synced yet.
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {connection.brokerageName ?? "Unknown Brokerage"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          Slug: {connection.brokerageSlug ?? "N/A"}
                        </p>
                      </div>

                      <div className="text-sm text-zinc-400">
                        Status: {connection.connectionStatus ?? "N/A"}{" "}
                        {connection.disabled ? "(disabled)" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
              Accounts
            </p>

            {accounts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
                No brokerage accounts synced yet.
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {account.accountName ?? "Unnamed Account"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          Number: {account.accountNumber ?? "N/A"}
                        </p>
                      </div>

                      <div className="text-sm text-zinc-400">
                        Type: {account.accountType ?? "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}