import { NextResponse } from "next/server";
import { z } from "zod";
import { getCandles, type Resolution } from "@/lib/finnhub";

const querySchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .transform((value) => value.toUpperCase()),
  resolution: z.enum(["1", "5", "15", "30", "60", "D", "W", "M"]).default("D"),
  // Window in days from now, default 30 days.
  days: z.coerce.number().int().positive().max(365).default(30),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const parsed = querySchema.safeParse({
      symbol: searchParams.get("symbol") ?? "",
      resolution: searchParams.get("resolution") ?? "D",
      days: searchParams.get("days") ?? "30",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid candle request." },
        { status: 400 }
      );
    }

    const { symbol, resolution, days } = parsed.data;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const fromSeconds = nowSeconds - days * 24 * 60 * 60;

    const candles = await getCandles(
      symbol,
      resolution as Resolution,
      fromSeconds,
      nowSeconds
    );

    return NextResponse.json({
      symbol,
      resolution,
      days,
      candles,
    });
  } catch (error) {
    console.error("GET /api/candles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candles." },
      { status: 500 }
    );
  }
}
