import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUserBrokerageAccounts,
  getUserBrokerageConnections,
} from "@/lib/brokerageAccounts";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [connections, accounts] = await Promise.all([
      getUserBrokerageConnections(userId),
      getUserBrokerageAccounts(userId),
    ]);

    return NextResponse.json({
      connections,
      accounts,
    });
  } catch (error) {
    console.error("GET /api/brokerage/local error:", error);

    return NextResponse.json(
      { error: "Failed to load local brokerage data." },
      { status: 500 }
    );
  }
}