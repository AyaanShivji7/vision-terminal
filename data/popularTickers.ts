/**
 * Curated list of large, liquid tickers surfaced as the default screener
 * universe and as a client-side fallback for autocomplete when the Finnhub
 * symbol search endpoint returns nothing.
 */

export type PopularTicker = {
  symbol: string;
  name: string;
};

export const POPULAR_TICKERS: PopularTicker[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)" },
  { symbol: "GOOG", name: "Alphabet Inc. (Class C)" },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "TSLA", name: "Tesla, Inc." },
  { symbol: "AVGO", name: "Broadcom Inc." },
  { symbol: "NFLX", name: "Netflix, Inc." },
  { symbol: "COST", name: "Costco Wholesale Corporation" },
  { symbol: "UBER", name: "Uber Technologies, Inc." },
  { symbol: "PANW", name: "Palo Alto Networks, Inc." },
  { symbol: "CRWD", name: "CrowdStrike Holdings, Inc." },
  { symbol: "SNOW", name: "Snowflake Inc." },
  { symbol: "PLTR", name: "Palantir Technologies Inc." },
  { symbol: "SHOP", name: "Shopify Inc." },
  { symbol: "COIN", name: "Coinbase Global, Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "BAC", name: "Bank of America Corporation" },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "MA", name: "Mastercard Incorporated" },
  { symbol: "LLY", name: "Eli Lilly and Company" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated" },
  { symbol: "XOM", name: "Exxon Mobil Corporation" },
  { symbol: "CVX", name: "Chevron Corporation" },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "HD", name: "The Home Depot, Inc." },
  { symbol: "DIS", name: "The Walt Disney Company" },
  { symbol: "BA", name: "The Boeing Company" },
  { symbol: "KO", name: "The Coca-Cola Company" },
  { symbol: "PEP", name: "PepsiCo, Inc." },
  { symbol: "INTC", name: "Intel Corporation" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated" },
  { symbol: "ORCL", name: "Oracle Corporation" },
  { symbol: "IBM", name: "International Business Machines" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF" },
];
