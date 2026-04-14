import { sql } from "@/lib/db";
import { getUserBrokeragePositions } from "@/lib/brokeragePositions";
import {
  getActivePortfolioSource,
  mapBrokeragePositionsToPortfolioHoldings,
  type PortfolioHolding,
  type PortfolioSource,
} from "@/lib/portfolioSource";
import { analyzePortfolio } from "@/lib/portfolioIntelligence";

type ManualHoldingRow = {
  id: string;
  ticker: string;
  shares: string | number;
  buy_price: string | number;
  current_price: string | number;
};

export type ActivePortfolioSnapshot = {
  source: PortfolioSource;
  holdings: PortfolioHolding[];
  intelligence: ReturnType<typeof analyzePortfolio>;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getActivePortfolioSnapshot(
  clerkUserId: string
): Promise<ActivePortfolioSnapshot> {
  const brokeragePositions = await getUserBrokeragePositions(clerkUserId);
  const brokerageHoldings =
    mapBrokeragePositionsToPortfolioHoldings(brokeragePositions);

  const manualRows = await sql`
    SELECT id, ticker, shares, buy_price, current_price
    FROM portfolio_holdings
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;

  const manualHoldings = (manualRows as ManualHoldingRow[]).map((row) => ({
    id: row.id,
    ticker: row.ticker,
    shares: Number(row.shares),
    buyPrice: Number(row.buy_price),
    currentPrice: Number(row.current_price),
  }));

  const { source, holdings } = getActivePortfolioSource(
    brokerageHoldings,
    manualHoldings
  );

  return {
    source,
    holdings,
    intelligence: analyzePortfolio(holdings),
  };
}

export function buildPortfolioContextBlock(snapshot: ActivePortfolioSnapshot) {
  if (snapshot.holdings.length === 0) {
    return [
      "PORTFOLIO_CONTEXT",
      "Source: none",
      "Holdings: none",
      "Use this: If user asks about their portfolio, clearly state no portfolio data is available yet.",
    ].join("\n");
  }

  const totalValue = snapshot.holdings.reduce(
    (sum, holding) => sum + holding.shares * holding.currentPrice,
    0
  );

  const topHoldings = snapshot.holdings
    .map((holding) => {
      const value = holding.shares * holding.currentPrice;
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return {
        ticker: holding.ticker,
        shares: holding.shares,
        value,
        weight,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map(
      (holding) =>
        `${holding.ticker}: ${round2(holding.shares)} shares, ${round2(
          holding.weight
        )}% weight`
    );

  const sectorExposureLines = snapshot.intelligence.sectorExposure
    .slice(0, 8)
    .map((sector) => `${sector.sector}: ${sector.weightPercent}%`);

  return [
    "PORTFOLIO_CONTEXT",
    `Source: ${
      snapshot.source === "brokerage"
        ? "Linked Brokerage Holdings"
        : "Manual Portfolio"
    }`,
    `Holdings count: ${snapshot.holdings.length}`,
    `Total value (USD): ${round2(snapshot.intelligence.totalValue)}`,
    `Top 3 concentration (%): ${snapshot.intelligence.concentrationPercent}`,
    `Diversification score (0-100): ${snapshot.intelligence.diversificationScore}`,
    `Top holdings: ${topHoldings.join(" | ") || "N/A"}`,
    `Sector exposure: ${sectorExposureLines.join(" | ") || "N/A"}`,
    `Warnings: ${snapshot.intelligence.warnings.join(" | ") || "None"}`,
    `Suggestions: ${snapshot.intelligence.suggestions.join(" | ") || "None"}`,
  ].join("\n");
}
