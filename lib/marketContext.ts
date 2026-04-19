import { getNews, getQuote } from "@/lib/finnhub";

type MarketHeadline = {
  headline: string;
  source: string;
  datetime: number;
};

type QuoteSnapshot = {
  symbol: string;
  currentPrice: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
};

const watchSymbols = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMD",
  "META",
  "GOOGL",
  "AMZN",
  "TSLA",
  "AVGO",
  "JPM",
  "V",
  "LLY",
  "PANW",
  "COST",
  "UBER",
];

export async function getMarketContext() {
  const newsData = await getNews();

  const headlines: MarketHeadline[] = newsData.slice(0, 8).map((item) => ({
    headline: item.headline,
    source: item.source,
    datetime: item.datetime,
  }));

  const quoteResults = await Promise.all(
    watchSymbols.map(async (symbol) => {
      const quote = await getQuote(symbol);

      if (!quote) {
        return null;
      }

      const snapshot: QuoteSnapshot = {
        symbol: quote.symbol,
        currentPrice: quote.currentPrice,
        percentChange: quote.percentChange,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previousClose,
      };

      return snapshot;
    })
  );

  const quotes = quoteResults.filter(Boolean) as QuoteSnapshot[];

  const biggestGainers = [...quotes]
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, 5);

  const biggestLosers = [...quotes]
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, 5);

  return {
    headlines,
    quotes,
    biggestGainers,
    biggestLosers,
  };
}

export function buildMarketContextPrompt(context: Awaited<ReturnType<typeof getMarketContext>>) {
  const headlineText = context.headlines
    .map(
      (item, index) =>
        `${index + 1}. ${item.headline} (${item.source})`
    )
    .join("\n");

  const quoteText = context.quotes
    .map(
      (item) =>
        `${item.symbol}: price ${item.currentPrice}, daily % change ${item.percentChange}, high ${item.high}, low ${item.low}, open ${item.open}, previous close ${item.previousClose}`
    )
    .join("\n");

  const gainerText = context.biggestGainers
    .map((item) => `${item.symbol} (${item.percentChange}%)`)
    .join(", ");

  const loserText = context.biggestLosers
    .map((item) => `${item.symbol} (${item.percentChange}%)`)
    .join(", ");

  return `
Use the following real market context when selecting today's top 10 stock ideas.

Recent market headlines:
${headlineText || "No headlines available."}

Quote snapshots:
${quoteText || "No quote snapshots available."}

Biggest gainers in the tracked watchlist:
${gainerText || "None"}

Biggest losers in the tracked watchlist:
${loserText || "None"}

Instructions:
- Use this context to make today's picks more timely and grounded
- You may choose from these symbols or other legitimate large-cap/publicly traded stocks if justified
- Avoid penny stocks
- Prefer liquid names with real relevance to current market conditions
  `.trim();
}
