import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateAndSaveDailyTopPicks } from "@/lib/generateDailyTopPicks";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateAndSaveDailyTopPicks();

    return NextResponse.json({
      ...result,
      triggeredBy: "cron",
    });
  } catch (error) {
    console.error("Cron generate top picks error:", error);

    return NextResponse.json(
      { error: "Failed to run cron generation." },
      { status: 500 }
    );
  }
}