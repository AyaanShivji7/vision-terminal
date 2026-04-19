import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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

function computeSignalStatus(
  entryPrice: number | null,
  currentPrice: number | null,
  takeProfit: string,
  stopLoss: string
) {
  if (entryPrice === null || currentPrice === null) {
    return {
      signalStatus: "monitoring",
      outcome: "open",
      returnPercent: 0,
      closedAt: null as string | null,
    };
  }

  const returnPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

  const tpMatch = takeProfit.match(/-?\d+(\.\d+)?/);
  const slMatch = stopLoss.match(/-?\d+(\.\d+)?/);

  const tp = tpMatch ? Number(tpMatch[0]) : null;
  const sl = slMatch ? Number(slMatch[0]) : null;

  if (tp !== null && currentPrice >= tp) {
    return {
      signalStatus: "take_profit_hit",
      outcome: "win",
      returnPercent,
      closedAt: new Date().toISOString(),
    };
  }

  if (sl !== null && currentPrice <= sl) {
    return {
      signalStatus: "stop_loss_hit",
      outcome: "loss",
      returnPercent,
      closedAt: new Date().toISOString(),
    };
  }

  return {
    signalStatus: "open",
    outcome: "open",
    returnPercent,
    closedAt: null as string | null,
  };
}

export async function POST() {
  try {
    const authResult = await requireAdmin();

    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const rows = await sql`
      SELECT id, ticker, entry_price, current_price, take_profit, stop_loss, signal_status
      FROM daily_top_picks
      ORDER BY pick_date DESC, rank ASC
    `;

    let updated = 0;

    for (const row of rows) {
      try {
        const livePrice = await fetchLivePrice(row.ticker);

        const status = computeSignalStatus(
          row.entry_price === null ? null : Number(row.entry_price),
          livePrice,
          row.take_profit,
          row.stop_loss
        );

        await sql`
          UPDATE daily_top_picks
          SET
            current_price = ${livePrice},
            signal_status = ${status.signalStatus},
            outcome = ${status.outcome},
            return_percent = ${status.returnPercent},
            closed_at = ${status.closedAt}
          WHERE id = ${row.id}
        `;

        updated += 1;
      } catch (error) {
        console.error(`Failed updating signal for ${row.ticker}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error("POST /api/signals/refresh error:", error);

    return NextResponse.json(
      { error: "Failed to refresh signals." },
      { status: 500 }
    );
  }
}