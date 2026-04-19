/**
 * Server-side observability.
 *
 * This module is intentionally dependency-free. It provides a single
 * `logError(error, context)` entry point that:
 *
 *   1. Always writes a structured line to stderr with console.error so
 *      logs still show up in Vercel's runtime logs.
 *   2. If LOGTAIL_SOURCE_TOKEN is set, POSTs the event to BetterStack /
 *      LogTail's HTTP ingest endpoint.
 *   3. If SENTRY_DSN is set, POSTs a minimal Sentry-compatible envelope.
 *
 * Swap in the official @sentry/nextjs SDK later if you want
 * breadcrumbs, performance traces, etc. — the callsites won't need to
 * change.
 */

type LogContext = Record<string, unknown>;

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function extractStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

async function forwardToLogtail(
  message: string,
  context: LogContext,
  stack: string | undefined
) {
  const token = process.env.LOGTAIL_SOURCE_TOKEN;
  if (!token) return;

  try {
    await fetch("https://in.logs.betterstack.com/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level: "error",
        message,
        stack,
        ...context,
      }),
      // Best-effort: don't let logging slow the request or throw.
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Swallow. We already logged to stderr.
  }
}

/**
 * Parse a Sentry DSN of the form:
 *   https://<publicKey>@<host>/<projectId>
 */
function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    const publicKey = url.username;

    if (!projectId || !publicKey) return null;

    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

async function forwardToSentry(
  message: string,
  context: LogContext,
  stack: string | undefined
) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  // Minimal Sentry envelope. Good enough for issue grouping + stack
  // traces. Upgrade to @sentry/nextjs when you want breadcrumbs.
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = new Date().toISOString();

  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: timestamp,
    dsn,
  });

  const itemHeader = JSON.stringify({ type: "event" });

  const event = {
    event_id: eventId,
    timestamp,
    platform: "node",
    level: "error",
    message,
    extra: context,
    exception: stack
      ? {
          values: [
            {
              type: "Error",
              value: message,
              stacktrace: { frames: [{ filename: "unknown", function: stack }] },
            },
          ],
        }
      : undefined,
  };

  const body = [envelopeHeader, itemHeader, JSON.stringify(event)].join("\n");

  try {
    await fetch(parsed.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": [
          "Sentry sentry_version=7",
          "sentry_client=vision-terminal/0.1",
          `sentry_key=${parsed.publicKey}`,
        ].join(", "),
      },
      body,
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Swallow.
  }
}

export function logError(error: unknown, context: LogContext = {}): void {
  const message = extractMessage(error);
  const stack = extractStack(error);

  console.error(
    JSON.stringify({
      level: "error",
      message,
      stack,
      ...context,
    })
  );

  // Fire and forget.
  void forwardToLogtail(message, context, stack);
  void forwardToSentry(message, context, stack);
}
