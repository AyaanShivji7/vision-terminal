import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/observability/server";

/**
 * Sink for client-side error reports. Accepts a JSON body with any of:
 *   { message, stack, digest, href, userAgent, ...context }
 *
 * We don't require auth because errors can happen on public pages, but
 * we attach the Clerk userId if one exists so issues can be traced to a
 * user when relevant.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return NextResponse.json({ ok: true });
    }

    const { userId } = await auth().catch(() => ({ userId: null }));

    const message =
      typeof body.message === "string" ? body.message : "client error";

    logError(new Error(message), {
      source: "client",
      userId,
      ...body,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never fail the caller — we already logged what we could.
    logError(error, { source: "client-log-sink" });
    return NextResponse.json({ ok: true });
  }
}
