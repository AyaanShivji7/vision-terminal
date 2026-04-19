"use client";

/**
 * Client-side error reporter.
 *
 * Forwards to our internal /api/log/client endpoint so the server-side
 * observability module can decide what to do with it (stderr + LogTail +
 * Sentry). Never throws — if the POST fails, we just console.error.
 */

type ReportContext = Record<string, unknown>;

export function reportClientError(
  error: Error & { digest?: string },
  context: ReportContext = {}
): void {
  const payload = {
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    href: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    ...context,
  };

  console.error("Client error:", payload);

  try {
    // keepalive lets the browser flush the POST even during navigation.
    fetch("/api/log/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Swallow — we already logged to the browser console.
    });
  } catch {
    // Swallow.
  }
}
