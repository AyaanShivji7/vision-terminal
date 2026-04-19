import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserBrokeragePositions } from "@/lib/brokeragePositions";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const positions = await getUserBrokeragePositions(userId);

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("GET /api/brokerage/local-positions error:", error);

    return NextResponse.json(
      { error: "Failed to load brokerage positions." },
      { status: 500 }
    );
  }
}