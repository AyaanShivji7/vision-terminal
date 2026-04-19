import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/finnhub";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (query.length < 1) {
      return NextResponse.json({ matches: [] });
    }

    const matches = await searchSymbols(query);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("GET /api/symbols/search error:", error);
    return NextResponse.json(
      { error: "Failed to search symbols." },
      { status: 500 }
    );
  }
}
