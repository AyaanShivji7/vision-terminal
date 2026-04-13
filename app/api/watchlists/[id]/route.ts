import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

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

    const { id } = await context.params;
    const body = await req.json();
    const ticker = String(body.ticker || "").trim().toUpperCase();

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required." },
        { status: 400 }
      );
    }

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
  } catch (error: any) {
    console.error("POST /api/watchlists/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add watchlist item." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

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
  } catch (error: any) {
    console.error("DELETE /api/watchlists/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete watchlist." },
      { status: 500 }
    );
  }
}