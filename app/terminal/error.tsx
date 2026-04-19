"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/client";

/**
 * Route-level error boundary for /terminal and its children.
 *
 * Next.js renders this component when anything inside app/terminal/**
 * throws during render. We report the error to our observability sink
 * (Sentry / LogTail / console fallback) and give the user a retry button
 * instead of a blank screen.
 */
export default function TerminalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { route: "/terminal" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Terminal error
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Something went sideways.
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          We hit an unexpected issue loading this panel. The team has been
          notified. You can retry, or come back in a moment.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-zinc-600">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black"
          >
            Try again
          </button>
          <a
            href="/terminal"
            className="rounded-xl border border-white/10 px-5 py-2 text-sm text-white hover:border-white/30"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
