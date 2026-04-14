import type { BrokeragePosition } from "@/lib/brokeragePositions";

export type PortfolioSource = "brokerage" | "manual";

export type PortfolioHolding = {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
};

export function mapBrokeragePositionsToPortfolioHoldings(
  positions: BrokeragePosition[]
): PortfolioHolding[] {
  return positions
    .map((position) => {
      const ticker = position.symbol?.trim().toUpperCase();
      const quantity = position.quantity ?? 0;
      const marketValue = position.marketValue ?? 0;
      const lastPrice = position.lastPrice ?? 0;
      const averagePurchasePrice = position.averagePurchasePrice ?? 0;

      if (!ticker || quantity <= 0) {
        return null;
      }

      const currentPrice =
        lastPrice > 0 ? lastPrice : marketValue > 0 ? marketValue / quantity : 0;

      if (currentPrice <= 0) {
        return null;
      }

      return {
        id: position.id,
        ticker,
        shares: quantity,
        buyPrice: averagePurchasePrice > 0 ? averagePurchasePrice : currentPrice,
        currentPrice,
      };
    })
    .filter((holding): holding is PortfolioHolding => holding !== null);
}

export function getActivePortfolioSource(
  brokerageHoldings: PortfolioHolding[],
  manualHoldings: PortfolioHolding[]
) {
  const source: PortfolioSource =
    brokerageHoldings.length > 0 ? "brokerage" : "manual";

  return {
    source,
    holdings: source === "brokerage" ? brokerageHoldings : manualHoldings,
  };
}
