import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getQuote } from "@/lib/finnhub";

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

        const quote = await getQuote(row.ticker);

        if (quote) {
          currentPrice = quote.currentPrice;

          try {
            await sql`
              UPDATE portfolio_holdings
              SET current_price = ${quote.currentPrice}
              WHERE id = ${row.id}
            `;
          } catch (error) {
            console.error(
              `Failed to persist refreshed price for ${row.ticker}:`,
              error
            );
          }
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

    const quote = await getQuote(ticker);

    if (!quote) {
      return NextResponse.json(
        { error: `Could not fetch a live price for ${ticker}.` },
        { status: 502 }
      );
    }

    const currentPrice = quote.currentPrice;
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
