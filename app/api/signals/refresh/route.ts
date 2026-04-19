import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getQuote } from "@/lib/finnhub";
import { decideSignal, parsePicksPricing } from "@/lib/pricing";

function computeReturnPercent(
  entryPrice: number | null,
  currentPrice: number
): number {
  if (entryPrice === null || entryPrice <= 0) return 0;
  return ((currentPrice - entryPrice) / entryPrice) * 100;
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
      SELECT
        id,
        ticker,
        entry_price,
        current_price,
        take_profit,
        stop_loss,
        take_profit_low,
        stop_loss_value,
        signal_status
      FROM daily_top_picks
      ORDER BY pick_date DESC, rank ASC
    `;

    let updated = 0;

    for (const row of rows) {
      try {
        const quote = await getQuote(row.ticker);

        if (!quote) {
          continue;
        }

        const livePrice = quote.currentPrice;

        // Prefer the structured numeric columns. Fall back to parsing the
        // text fields so rows inserted before migration 0003 still work.
        let takeProfitLow: number | null =
          row.take_profit_low === null ? null : Number(row.take_profit_low);
        let stopLoss: number | null =
          row.stop_loss_value === null ? null : Number(row.stop_loss_value);

        if (takeProfitLow === null || stopLoss === null) {
          const parsed = parsePicksPricing({
            buyZone: null,
            takeProfit: row.take_profit,
            stopLoss: row.stop_loss,
          });
          if (takeProfitLow === null) takeProfitLow = parsed.takeProfitLow;
          if (stopLoss === null) stopLoss = parsed.stopLoss;
        }

        const decision = decideSignal(livePrice, {
          takeProfitLow,
          stopLoss,
        });

        const returnPercent = computeReturnPercent(
          row.entry_price === null ? null : Number(row.entry_price),
          livePrice
        );

        await sql`
          UPDATE daily_top_picks
          SET
            current_price = ${livePrice},
            signal_status = ${decision.status},
            outcome = ${decision.outcome},
            return_percent = ${returnPercent},
            closed_at = ${decision.closedAt}
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
