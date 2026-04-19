import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import {
  generateSnapTradeLoginLink,
  registerSnapTradeUser,
} from "@/lib/snaptrade";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingRows = await sql`
      SELECT snaptrade_user_id, snaptrade_user_secret
      FROM brokerage_users
      WHERE clerk_user_id = ${userId}
      LIMIT 1
    `;

    let snaptradeUserId: string;
    let snaptradeUserSecret: string;

    if (existingRows.length > 0) {
      snaptradeUserId = existingRows[0].snaptrade_user_id;
      snaptradeUserSecret = existingRows[0].snaptrade_user_secret;
    } else {
      snaptradeUserId = `vision_${userId}`;

      const registration = await registerSnapTradeUser(snaptradeUserId);

      if (!registration?.userSecret) {
        throw new Error("SnapTrade did not return a userSecret.");
      }

      snaptradeUserSecret = registration.userSecret;

      await sql`
        INSERT INTO brokerage_users (
          id,
          clerk_user_id,
          snaptrade_user_id,
          snaptrade_user_secret
        )
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${snaptradeUserId},
          ${snaptradeUserSecret}
        )
      `;
    }

    const loginData = await generateSnapTradeLoginLink(
      snaptradeUserId,
      snaptradeUserSecret
    );

    // SnapTrade SDK's return type is a discriminated union where some
    // variants expose the redirect URL under different keys. Cast once so
    // we can read whichever field is populated without fighting the types.
    const loginDataAny = loginData as unknown as Record<string, unknown>;
    const redirectUri =
      (loginDataAny.redirectURI as string | undefined) ||
      (loginDataAny.redirectUri as string | undefined) ||
      (loginDataAny.url as string | undefined);

    if (!redirectUri) {
      throw new Error("SnapTrade did not return a redirect URI.");
    }

    return NextResponse.json({ redirectUri });
  } catch (error) {
    console.error("POST /api/brokerage/link error:", error);

    return NextResponse.json(
      { error: "Failed to create brokerage link." },
      { status: 500 }
    );
  }
}