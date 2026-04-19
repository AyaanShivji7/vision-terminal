import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateAndSaveDailyTopPicks } from "@/lib/generateDailyTopPicks";

export async function GET() {
  try {
    const authResult = await requireAdmin();

    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const result = await generateAndSaveDailyTopPicks();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate top picks error:", error);

    return NextResponse.json(
      { error: "Failed to generate daily top picks." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
