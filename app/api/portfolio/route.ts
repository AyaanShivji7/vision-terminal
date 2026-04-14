import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getUserBrokeragePositions } from "@/lib/brokeragePositions";
import {
  getActivePortfolioSource,
  mapBrokeragePositionsToPortfolioHoldings,
} from "@/lib/portfolioSource";

type PortfolioHoldingRow = {
  id: string;
  ticker: string;
  shares: string | number;
  buy_price: string | number;
  current_price: string | number;
  created_at: string;
};

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

    const refreshedManualHoldings = await Promise.all(
      (rows as PortfolioHoldingRow[]).map(async (row) => {
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

    const brokeragePositions = await getUserBrokeragePositions(userId);
    const brokerageHoldings =
      mapBrokeragePositionsToPortfolioHoldings(brokeragePositions);

    // Branch source selection here:
    // Prefer imported brokerage holdings when positions have usable quantity/price/value data.
    // Fall back to manual holdings when linked brokerage data is unavailable or unusable.
    const { source, holdings } = getActivePortfolioSource(
      brokerageHoldings,
      refreshedManualHoldings
    );

    return NextResponse.json({
      source,
      holdings,
    });
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

    const body = await req.json();
    const ticker = String(body.ticker || "").trim().toUpperCase();
    const shares = Number(body.shares);
    const buyPrice = Number(body.buyPrice);

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required." }, { status: 400 });
    }

    if (!shares || shares <= 0) {
      return NextResponse.json(
        { error: "Shares must be greater than 0." },
        { status: 400 }
      );
    }

    if (!buyPrice || buyPrice <= 0) {
      return NextResponse.json(
        { error: "Buy price must be greater than 0." },
        { status: 400 }
      );
    }

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
  } catch (error: unknown) {
    console.error("POST /api/portfolio error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save holding.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
