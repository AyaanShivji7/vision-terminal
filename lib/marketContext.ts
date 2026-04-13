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

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return response.json();
}

export async function getMarketContext() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  const newsUrl = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
  const newsData = await fetchJson(newsUrl);

  const headlines: MarketHeadline[] = Array.isArray(newsData)
    ? newsData.slice(0, 8).map((item: any) => ({
        headline: String(item.headline || ""),
        source: String(item.source || "Unknown"),
        datetime: Number(item.datetime || 0),
      }))
    : [];

  const quoteResults = await Promise.all(
    watchSymbols.map(async (symbol) => {
      try {
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const data = await fetchJson(quoteUrl);

        if (!data || typeof data.c !== "number" || data.c <= 0) {
          return null;
        }

        const snapshot: QuoteSnapshot = {
          symbol,
          currentPrice: Number(data.c),
          percentChange: Number(data.dp || 0),
          high: Number(data.h || 0),
          low: Number(data.l || 0),
          open: Number(data.o || 0),
          previousClose: Number(data.pc || 0),
        };

        return snapshot;
      } catch {
        return null;
      }
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