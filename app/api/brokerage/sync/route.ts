import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import {
  listSnapTradeAccounts,
  listSnapTradeConnections,
} from "@/lib/snaptrade";

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

    const connections = await listSnapTradeConnections(
      snaptradeUserId,
      snaptradeUserSecret
    );

    const accounts = await listSnapTradeAccounts(
      snaptradeUserId,
      snaptradeUserSecret
    );

    await sql`
      DELETE FROM brokerage_accounts
      WHERE clerk_user_id = ${userId}
    `;

    await sql`
      DELETE FROM brokerage_connections
      WHERE clerk_user_id = ${userId}
    `;

    for (const connection of connections ?? []) {
      const authorizationId =
        connection.id ||
        connection.authorizationId ||
        connection.brokerageAuthorizationId;

      await sql`
        INSERT INTO brokerage_connections (
          id,
          clerk_user_id,
          snaptrade_authorization_id,
          brokerage_name,
          brokerage_slug,
          connection_status,
          disabled
        )
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${String(authorizationId)},
          ${connection.name ?? connection.brokerage?.name ?? null},
          ${connection.slug ?? connection.brokerage?.slug ?? null},
          ${connection.status ?? null},
          ${Boolean(connection.disabled ?? false)}
        )
      `;
    }

    for (const account of accounts ?? []) {
      const accountId =
        account.id ||
        account.accountId ||
        account.number;

      const authorizationId =
        account.brokerageAuthorization ||
        account.brokerageAuthorizationId ||
        account.authorizationId ||
        null;

      const linkedConnectionRows =
        authorizationId === null
          ? []
          : await sql`
              SELECT id
              FROM brokerage_connections
              WHERE clerk_user_id = ${userId}
                AND snaptrade_authorization_id = ${String(authorizationId)}
              LIMIT 1
            `;

      const brokerageConnectionId =
        linkedConnectionRows.length > 0 ? linkedConnectionRows[0].id : null;

      await sql`
        INSERT INTO brokerage_accounts (
          id,
          clerk_user_id,
          brokerage_connection_id,
          snaptrade_account_id,
          account_name,
          account_number,
          account_type,
          balance_json,
          raw_json,
          last_synced_at
        )
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${brokerageConnectionId},
          ${String(accountId)},
          ${account.name ?? null},
          ${account.number ?? null},
          ${account.institutionName ?? account.type ?? null},
          ${JSON.stringify(account.balance ?? null)},
          ${JSON.stringify(account)},
          NOW()
        )
      `;
    }

    return NextResponse.json({
      success: true,
      connectionCount: connections?.length ?? 0,
      accountCount: accounts?.length ?? 0,
    });
  } catch (error: any) {
    console.error("POST /api/brokerage/sync error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to sync brokerage accounts." },
      { status: 500 }
    );
  }
}