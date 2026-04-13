import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const rows = await sql`
      SELECT wi.id
      FROM watchlist_items wi
      JOIN watchlists w ON wi.watchlist_id = w.id
      WHERE wi.id = ${id}
        AND w.clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: "Watchlist item not found." },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM watchlist_items
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/watchlist-items/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete watchlist item." },
      { status: 500 }
    );
  }
}