import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { listSnapTradePositions } from "@/lib/snaptrade";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brokerageUserRows = await sql`
      SELECT snaptrade_user_id, snaptrade_user_secret
      FROM brokerage_users
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    if (!brokerageUserRows.length) {
      return NextResponse.json(
        { error: "No linked SnapTrade user found yet." },
        { status: 404 }
      );
    }

    const snaptradeUserId = brokerageUserRows[0].snaptrade_user_id;
    const snaptradeUserSecret = brokerageUserRows[0].snaptrade_user_secret;

    const accountRows = await sql`
      SELECT id, snaptrade_account_id
      FROM brokerage_accounts
      WHERE clerk_user_id = ${userId}
    `;

    await sql`
      DELETE FROM brokerage_positions
      WHERE clerk_user_id = ${userId}
    `;

    let totalPositions = 0;

    for (const account of accountRows) {
      try {
        const positions = await listSnapTradePositions(
          snaptradeUserId,
          snaptradeUserSecret,
          account.snaptrade_account_id
        );

        for (const position of positions ?? []) {
          const symbol =
            position.symbol?.symbol ||
            position.symbol?.ticker ||
            position.ticker ||
            position.symbol ||
            null;

          const description =
            position.symbol?.description ||
            position.description ||
            null;

          const quantity =
            position.units !== undefined && position.units !== null
              ? Number(position.units)
              : position.quantity !== undefined && position.quantity !== null
              ? Number(position.quantity)
              : null;

          const marketValue =
            position.marketValue !== undefined && position.marketValue !== null
              ? Number(position.marketValue)
              : null;

          const averagePurchasePrice =
            position.averagePurchasePrice !== undefined &&
            position.averagePurchasePrice !== null
              ? Number(position.averagePurchasePrice)
              : position.average_price !== undefined &&
                position.average_price !== null
              ? Number(position.average_price)
              : null;

          const lastPrice =
            position.price !== undefined && position.price !== null
              ? Number(position.price)
              : position.lastPrice !== undefined && position.lastPrice !== null
              ? Number(position.lastPrice)
              : null;

          await sql`
            INSERT INTO brokerage_positions (
              id,
              clerk_user_id,
              brokerage_account_id,
              snaptrade_account_id,
              symbol,
              description,
              quantity,
              market_value,
              average_purchase_price,
              last_price,
              raw_json,
              last_synced_at
            )
            VALUES (
              ${crypto.randomUUID()},
              ${userId},
              ${account.id},
              ${account.snaptrade_account_id},
              ${symbol},
              ${description},
              ${quantity},
              ${marketValue},
              ${averagePurchasePrice},
              ${lastPrice},
              ${JSON.stringify(position)},
              NOW()
            )
          `;

          totalPositions += 1;
        }
      } catch (error) {
        console.error(
          `Failed syncing positions for account ${account.snaptrade_account_id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      accountCount: accountRows.length,
      positionCount: totalPositions,
    });
  } catch (error) {
    console.error("POST /api/brokerage/sync-positions error:", error);

    return NextResponse.json(
      { error: "Failed to sync brokerage positions." },
      { status: 500 }
    );
  }
}