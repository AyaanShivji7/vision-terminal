import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

const uuidSchema = z.uuid({ error: "Invalid holding id." });

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
    const parsedId = uuidSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? "Invalid holding id." },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM portfolio_holdings
      WHERE id = ${parsedId.data}
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