import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

const addHoldingSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker is required.")
    .max(10, "Ticker looks invalid.")
    .transform((value) => value.toUpperCase()),
  shares: z
    .number({ message: "Shares must be a number." })
    .positive("Shares must be greater than 0.")
    .finite(),
  buyPrice: z
    .number({ message: "Buy price must be a number." })
    .positive("Buy price must be greater than 0.")
    .finite(),
});

async function fetchLivePrice(ticker: string) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch live price for ${ticker}`);
  }

  const data = await response.json();

  if (!data || typeof data.c !== "number" || data.c <= 0) {
    throw new Error(`Invalid live price for ${ticker}`);
  }

  return Number(data.c);
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, ticker, shares, buy_price, current_price, created_at
      FROM portfolio_holdings
      WHERE clerk_user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const refreshedHoldings = await Promise.all(
      rows.map(async (row: any) => {
        let currentPrice = Number(row.current_price);

        try {
          const livePrice = await fetchLivePrice(row.ticker);
          currentPrice = livePrice;

          await sql`
            UPDATE portfolio_holdings
            SET current_price = ${livePrice}
            WHERE id = ${row.id}
          `;
        } catch (error) {
          console.error(`Price refresh failed for ${row.ticker}:`, error);
        }

        return {
          id: row.id,
          ticker: row.ticker,
          shares: Number(row.shares),
          buyPrice: Number(row.buy_price),
          currentPrice,
          createdAt: row.created_at,
        };
      })
    );

    return NextResponse.json({ holdings: refreshedHoldings });
  } catch (error) {
    console.error("GET /api/portfolio error:", error);
    return NextResponse.json(
      { error: "Failed to load portfolio." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = addHoldingSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid holding payload." },
        { status: 400 }
      );
    }

    const { ticker, shares, buyPrice } = parsed.data;

    const currentPrice = await fetchLivePrice(ticker);
    const id = crypto.randomUUID();

    await sql`
      INSERT INTO portfolio_holdings (
        id,
        clerk_user_id,
        ticker,
        shares,
        buy_price,
        current_price
      )
      VALUES (
        ${id},
        ${userId},
        ${ticker},
        ${shares},
        ${buyPrice},
        ${currentPrice}
      )
    `;

    return NextResponse.json({
      holding: {
        id,
        ticker,
        shares,
        buyPrice,
        currentPrice,
      },
    });
  } catch (error) {
    console.error("POST /api/portfolio error:", error);

    return NextResponse.json(
      { error: "Failed to save holding." },
      { status: 500 }
    );
  }
}
