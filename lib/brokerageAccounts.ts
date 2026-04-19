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

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    authorizationId: row.snaptrade_authorization_id as string,
    brokerageName: (row.brokerage_name as string | null) ?? null,
    brokerageSlug: (row.brokerage_slug as string | null) ?? null,
    connectionStatus: (row.connection_status as string | null) ?? null,
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

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    brokerageConnectionId:
      (row.brokerage_connection_id as string | null) ?? null,
    snaptradeAccountId: row.snaptrade_account_id as string,
    accountName: (row.account_name as string | null) ?? null,
    accountNumber: (row.account_number as string | null) ?? null,
    accountType: (row.account_type as string | null) ?? null,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
  })) as BrokerageAccount[];
}