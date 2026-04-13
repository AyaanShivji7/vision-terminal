import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getEdmontonDateString } from "@/lib/date";
import { seedTopPicks } from "@/data/seedTopPicks";

async function seedTodaysPicks() {
  const today = getEdmontonDateString();

  await sql`
    DELETE FROM daily_top_picks
    WHERE pick_date = ${today}
  `;

  for (let i = 0; i < seedTopPicks.length; i++) {
    const pick = seedTopPicks[i];

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

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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