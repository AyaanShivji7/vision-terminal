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

    await sql`
      DELETE FROM portfolio_holdings
      WHERE id = ${id}
      AND clerk_user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/portfolio/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete holding." },
      { status: 500 }
    );
  }
}