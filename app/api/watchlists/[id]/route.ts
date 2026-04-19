import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

const watchlistIdSchema = z.uuid({ error: "Invalid watchlist id." });

const addItemSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker is required.")
    .max(10, "Ticker looks invalid.")
    .transform((value) => value.toUpperCase()),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const parsedId = watchlistIdSchema.safeParse(rawId);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? "Invalid watchlist id." },
        { status: 400 }
      );
    }

    const id = parsedId.data;

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsedBody = addItemSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            parsedBody.error.issues[0]?.message ??
            "Invalid watchlist item payload.",
        },
        { status: 400 }
      );
    }

    const { ticker } = parsedBody.data;

    const watchlistRows = await sql`
      SELECT id
      FROM watchlists
      WHERE id = ${id}
        AND clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!watchlistRows.length) {
      return NextResponse.json(
        { error: "Watchlist not found." },
        { status: 404 }
      );
    }

    const itemId = crypto.randomUUID();

    await sql`
      INSERT INTO watchlist_items (id, watchlist_id, ticker)
      VALUES (${itemId}, ${id}, ${ticker})
    `;

    return NextResponse.json({
      success: true,
      item: {
        id: itemId,
        ticker,
      },
    });
  } catch (error) {
    console.error("POST /api/watchlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to add watchlist item." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const parsedId = watchlistIdSchema.safeParse(rawId);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? "Invalid watchlist id." },
        { status: 400 }
      );
    }

    const id = parsedId.data;

    const watchlistRows = await sql`
      SELECT id
      FROM watchlists
      WHERE id = ${id}
        AND clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!watchlistRows.length) {
      return NextResponse.json(
        { error: "Watchlist not found." },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM watchlist_items
      WHERE watchlist_id = ${id}
    `;

    await sql`
      DELETE FROM watchlists
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/watchlists/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete watchlist." },
      { status: 500 }
    );
  }
}
