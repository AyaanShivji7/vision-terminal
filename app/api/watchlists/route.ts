import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getUserWatchlists } from "@/lib/watchlists";

const createWatchlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Watchlist name is required.")
    .max(60, "Watchlist name is too long."),
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watchlists = await getUserWatchlists(userId);
    return NextResponse.json({ watchlists });
  } catch (error) {
    console.error("GET /api/watchlists error:", error);
    return NextResponse.json(
      { error: "Failed to load watchlists." },
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

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = createWatchlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid watchlist payload.",
        },
        { status: 400 }
      );
    }

    const { name } = parsed.data;
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
  } catch (error) {
    console.error("POST /api/watchlists error:", error);
    return NextResponse.json(
      { error: "Failed to create watchlist." },
      { status: 500 }
    );
  }
}
