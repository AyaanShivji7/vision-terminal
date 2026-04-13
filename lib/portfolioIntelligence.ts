export type PortfolioHoldingForIntelligence = {
    ticker: string;
    shares: number;
    buyPrice: number;
    currentPrice: number;
  };
  
  export type SectorExposure = {
    sector: string;
    value: number;
    weightPercent: number;
  };
  
  export type PortfolioIntelligence = {
    totalValue: number;
    sectorExposure: SectorExposure[];
    concentrationPercent: number;
    diversificationScore: number;
    warnings: string[];
    strengths: string[];
    suggestions: string[];
    commentary: string;
  };
  
  const tickerSectorMap: Record<string, string> = {
    AAPL: "Technology",
    MSFT: "Technology",
    NVDA: "Technology",
    AMD: "Technology",
    META: "Communication Services",
    GOOGL: "Communication Services",
    AMZN: "Consumer Discretionary",
    TSLA: "Consumer Discretionary",
    AVGO: "Technology",
    JPM: "Financials",
    V: "Financials",
    LLY: "Healthcare",
    PANW: "Technology",
    COST: "Consumer Staples",
    UBER: "Industrials",
  };
  
  function getSector(ticker: string) {
    return tickerSectorMap[ticker.toUpperCase()] ?? "Other";
  }
  
  function round2(value: number) {
    return Math.round(value * 100) / 100;
  }
  
  export function analyzePortfolio(
    holdings: PortfolioHoldingForIntelligence[]
  ): PortfolioIntelligence {
    const totalValue = holdings.reduce(
      (sum, holding) => sum + holding.shares * holding.currentPrice,
      0
    );
  
    const sectorValueMap = new Map<string, number>();
  
    for (const holding of holdings) {
      const sector = getSector(holding.ticker);
      const value = holding.shares * holding.currentPrice;
      sectorValueMap.set(sector, (sectorValueMap.get(sector) ?? 0) + value);
    }
  
    const sectorExposure: SectorExposure[] = [...sectorValueMap.entries()]
      .map(([sector, value]) => ({
        sector,
        value: round2(value),
        weightPercent: totalValue > 0 ? round2((value / totalValue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  
    const holdingWeights = holdings
      .map((holding) => {
        const value = holding.shares * holding.currentPrice;
        return totalValue > 0 ? (value / totalValue) * 100 : 0;
      })
      .sort((a, b) => b - a);
  
    const concentrationPercent = round2(
      (holdingWeights[0] ?? 0) + (holdingWeights[1] ?? 0) + (holdingWeights[2] ?? 0)
    );
  
    let diversificationScore = 100;
  
    if (sectorExposure.length <= 2) diversificationScore -= 30;
    else if (sectorExposure.length <= 4) diversificationScore -= 15;
  
    if (concentrationPercent > 70) diversificationScore -= 35;
    else if (concentrationPercent > 55) diversificationScore -= 20;
    else if (concentrationPercent > 40) diversificationScore -= 10;
  
    const topSectorWeight = sectorExposure[0]?.weightPercent ?? 0;
    if (topSectorWeight > 50) diversificationScore -= 25;
    else if (topSectorWeight > 35) diversificationScore -= 12;
  
    diversificationScore = Math.max(0, round2(diversificationScore));
  
    const warnings: string[] = [];
    const strengths: string[] = [];
    const suggestions: string[] = [];
  
    if (topSectorWeight > 45) {
      warnings.push(
        `Your portfolio is heavily concentrated in ${sectorExposure[0].sector} at ${topSectorWeight}%.`
      );
    }
  
    if (concentrationPercent > 60) {
      warnings.push(
        `Your top 3 holdings represent ${concentrationPercent}% of your portfolio value.`
      );
    }
  
    if (sectorExposure.length <= 3 && holdings.length >= 4) {
      warnings.push("Your portfolio has limited sector diversification.");
    }
  
    if (diversificationScore >= 75) {
      strengths.push("Your portfolio shows relatively healthy diversification.");
    }
  
    if (sectorExposure.length >= 4) {
      strengths.push(`You have exposure across ${sectorExposure.length} sectors.`);
    }
  
    if (topSectorWeight < 35 && concentrationPercent < 50) {
      strengths.push("Your concentration risk is relatively controlled.");
    }
  
    if (topSectorWeight > 45) {
      suggestions.push(
        `Consider reducing exposure to ${sectorExposure[0].sector} and balancing with underrepresented sectors.`
      );
    }
  
    const sectorNames = sectorExposure.map((item) => item.sector);
  
    if (!sectorNames.includes("Healthcare")) {
      suggestions.push("Consider adding some Healthcare exposure for balance.");
    }
  
    if (!sectorNames.includes("Financials")) {
      suggestions.push("Consider adding Financials to reduce correlation risk.");
    }
  
    if (concentrationPercent > 60) {
      suggestions.push(
        "Reduce top-position concentration to lower volatility and single-name risk."
      );
    }
  
    let commentary = "Your portfolio is currently being tracked.";
  
    if (holdings.length === 0) {
      commentary =
        "You have not added any holdings yet, so portfolio intelligence is not available.";
    } else if (warnings.length > 0) {
      commentary = `Your portfolio appears somewhat concentrated. The main issue is ${warnings[0].toLowerCase()} ${
        suggestions[0] ? `A reasonable next step would be to ${suggestions[0].charAt(0).toLowerCase()}${suggestions[0].slice(1)}` : ""
      }`;
    } else if (strengths.length > 0) {
      commentary = `Your portfolio structure looks fairly solid. ${strengths[0]} ${
        suggestions[0] ? `You could improve it further by ${suggestions[0].charAt(0).toLowerCase()}${suggestions[0].slice(1)}` : ""
      }`;
    }
  
    return {
      totalValue: round2(totalValue),
      sectorExposure,
      concentrationPercent,
      diversificationScore,
      warnings,
      strengths,
      suggestions,
      commentary,
    };
  }