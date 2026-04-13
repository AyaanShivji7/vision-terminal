import { sql } from "@/lib/db";

export type BrokerageConnection = {
  id: string;
  authorizationId: string;
  brokerageName: string | null;
  brokerageSlug: string | null;
  connectionStatus: string | null;
  disabled: boolean;
};

export type BrokerageAccount = {
  id: string;
  brokerageConnectionId: string | null;
  snaptradeAccountId: string;
  accountName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  lastSyncedAt: string | null;
};

export async function getUserBrokerageConnections(clerkUserId: string) {
  const rows = await sql`
    SELECT
      id,
      snaptrade_authorization_id,
      brokerage_name,
      brokerage_slug,
      connection_status,
      disabled
    FROM brokerage_connections
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    id: row.id,
    authorizationId: row.snaptrade_authorization_id,
    brokerageName: row.brokerage_name ?? null,
    brokerageSlug: row.brokerage_slug ?? null,
    connectionStatus: row.connection_status ?? null,
    disabled: Boolean(row.disabled),
  })) as BrokerageConnection[];
}

export async function getUserBrokerageAccounts(clerkUserId: string) {
  const rows = await sql`
    SELECT
      id,
      brokerage_connection_id,
      snaptrade_account_id,
      account_name,
      account_number,
      account_type,
      last_synced_at
    FROM brokerage_accounts
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;

  return rows.map((row: any) => ({
    id: row.id,
    brokerageConnectionId: row.brokerage_connection_id ?? null,
    snaptradeAccountId: row.snaptrade_account_id,
    accountName: row.account_name ?? null,
    accountNumber: row.account_number ?? null,
    accountType: row.account_type ?? null,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
  })) as BrokerageAccount[];
}