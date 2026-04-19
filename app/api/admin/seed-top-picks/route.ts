import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getEdmontonDateString } from "@/lib/date";
import { seedTopPicks } from "@/data/seedTopPicks";
import { parsePicksPricing } from "@/lib/pricing";

async function seedTodaysPicks() {
  const today = getEdmontonDateString();

  await sql`
    DELETE FROM daily_top_picks
    WHERE pick_date = ${today}
  `;

  for (let i = 0; i < seedTopPicks.length; i++) {
    const pick = seedTopPicks[i];

    const pricing = parsePicksPricing({
      buyZone: pick.buyZone,
      takeProfit: pick.takeProfit,
      stopLoss: pick.stopLoss,
    });

    await sql`
      INSERT INTO daily_top_picks (
        id,
        pick_date,
        rank,
        ticker,
        company,
        short_reason,
        summary,
        buy_zone,
        take_profit,
        stop_loss,
        buy_zone_low,
        buy_zone_high,
        take_profit_low,
        take_profit_high,
        stop_loss_value,
        reasoning
      )
      VALUES (
        ${crypto.randomUUID()},
        ${today},
        ${i + 1},
        ${pick.ticker},
        ${pick.company},
        ${pick.shortReason},
        ${pick.summary},
        ${pick.buyZone},
        ${pick.takeProfit},
        ${pick.stopLoss},
        ${pricing.buyZoneLow},
        ${pricing.buyZoneHigh},
        ${pricing.takeProfitLow},
        ${pricing.takeProfitHigh},
        ${pricing.stopLoss},
        ${pick.reasoning}
      )
    `;
  }

  return {
    success: true,
    date: today,
    count: seedTopPicks.length,
  };
}

async function handleSeed() {
  const authResult = await requireAdmin();

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const result = await seedTodaysPicks();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seed top picks error:", error);
    return NextResponse.json(
      { error: "Failed to seed daily top picks." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}
