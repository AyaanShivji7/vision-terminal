import { Snaptrade } from "snaptrade-typescript-sdk";

function getSnapTradeClient() {
  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    throw new Error("Missing SnapTrade credentials in environment variables.");
  }

  return new Snaptrade({
    clientId,
    consumerKey,
  });
}

export async function registerSnapTradeUser(snaptradeUserId: string) {
  const snaptrade = getSnapTradeClient();

  const response = await snaptrade.authentication.registerSnapTradeUser({
    userId: snaptradeUserId,
  });

  return response.data;
}

export async function generateSnapTradeLoginLink(
  snaptradeUserId: string,
  userSecret: string
) {
  const snaptrade = getSnapTradeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  const response = await snaptrade.authentication.loginSnapTradeUser({
    userId: snaptradeUserId,
    userSecret,
    connectionType: "read",
    customRedirect: `${appUrl}/terminal`,
    showCloseButton: true,
    connectionPortalVersion: "v4",
  });

  return response.data;
}

export async function listSnapTradeConnections(
  snaptradeUserId: string,
  userSecret: string
) {
  const snaptrade = getSnapTradeClient();

  const response = await snaptrade.connections.listBrokerageAuthorizations({
    userId: snaptradeUserId,
    userSecret,
  });

  return response.data;
}

export async function listSnapTradeAccounts(
  snaptradeUserId: string,
  userSecret: string
) {
  const snaptrade = getSnapTradeClient();

  const response = await snaptrade.accountInformation.listUserAccounts({
    userId: snaptradeUserId,
    userSecret,
  });

  return response.data;
}