import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.trim().toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing symbol parameter." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FINNHUB_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quote from Finnhub." },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || typeof data.c !== "number" || data.c <= 0) {
      return NextResponse.json(
        { error: "Invalid quote data returned." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol,
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    });
  } catch (error) {
    console.error("GET /api/quote error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching quote." },
      { status: 500 }
    );
  }
}