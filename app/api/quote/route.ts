import { NextResponse } from "next/server";
import { getQuote } from "@/lib/finnhub";

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

    const quote = await getQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        { error: "Quote unavailable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: quote.symbol,
      currentPrice: quote.currentPrice,
      change: quote.change,
      percentChange: quote.percentChange,
      high: quote.high,
      low: quote.low,
      open: quote.open,
      previousClose: quote.previousClose,
    });
  } catch (error) {
    console.error("GET /api/quote error:", error);
    return NextResponse.json(
      { error: "Something went wrong while fetching quote." },
      { status: 500 }
    );
  }
}
