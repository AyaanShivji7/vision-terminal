import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAndSaveDailyTopPicks } from "@/lib/generateDailyTopPicks";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateAndSaveDailyTopPicks();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Generate top picks error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to generate daily top picks." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}