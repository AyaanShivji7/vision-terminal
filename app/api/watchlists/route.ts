import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getUserWatchlists } from "@/lib/watchlists";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watchlists = await getUserWatchlists(userId);
    return NextResponse.json({ watchlists });
  } catch (error: any) {
    console.error("GET /api/watchlists error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load watchlists." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Watchlist name is required." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await sql`
      INSERT INTO watchlists (id, clerk_user_id, name)
      VALUES (${id}, ${userId}, ${name})
    `;

    return NextResponse.json({
      watchlist: {
        id,
        name,
        items: [],
      },
    });
  } catch (error: any) {
    console.error("POST /api/watchlists error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create watchlist." },
      { status: 500 }
    );
  }
}