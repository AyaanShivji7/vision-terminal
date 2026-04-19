/**
 * Parses the free-form price strings that the LLM produces for buyZone,
 * takeProfit, and stopLoss into structured numeric columns so signal math
 * is unambiguous and we can run DB-side filters (e.g. "picks within 2%
 * of their take-profit").
 *
 * Design goals:
 *   - Be forgiving. Inputs can look like:
 *       "$120 - $126", "120–126", "around $132", "TP: 132 to 140",
 *       "Stop @ 116", "$116.50", "≈ 128".
 *   - Always return numbers or null; never throw.
 *   - Preserve the original string alongside the parsed fields so the UI
 *     can keep showing the LLM's wording.
 */

export type ParsedRange = {
  low: number | null;
  high: number | null;
};

export type ParsedLevel = {
  value: number | null;
};

/**
 * Pulls all positive numeric tokens out of a string. Accepts standard
 * "$1,234.56" formatting as well as bare numbers.
 */
function extractNumbers(input: string): number[] {
  if (!input) return [];

  // Match optional $, digits with optional thousands separators, optional decimal.
  const regex = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  const numbers: number[] = [];

  for (const match of input.matchAll(regex)) {
    const raw = match[1].replace(/,/g, "");
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      numbers.push(n);
    }
  }

  return numbers;
}

/**
 * Parse a range-like string into { low, high }. Examples:
 *   "$120 - $126"   -> { low: 120, high: 126 }
 *   "120 to 140"    -> { low: 120, high: 140 }
 *   "around $132"   -> { low: 132, high: 132 }  (single number => both)
 *   "n/a"           -> { low: null, high: null }
 */
export function parseRange(input: string | null | undefined): ParsedRange {
  if (!input || typeof input !== "string") {
    return { low: null, high: null };
  }

  const nums = extractNumbers(input);

  if (nums.length === 0) {
    return { low: null, high: null };
  }

  if (nums.length === 1) {
    return { low: nums[0], high: nums[0] };
  }

  // Take the first two distinct values for the range; ignore stray numbers
  // (e.g. percent callouts that sneak in).
  const [a, b] = [nums[0], nums[1]];
  const low = Math.min(a, b);
  const high = Math.max(a, b);

  return { low, high };
}

/**
 * Parse a single-level string (take-profit or stop-loss) into a numeric
 * value. If the string happens to describe a range (e.g. "$132 - $140"
 * for a scaled take-profit), we pick the midpoint so downstream signal
 * math has a single comparison point.
 */
export function parseLevel(input: string | null | undefined): ParsedLevel {
  if (!input || typeof input !== "string") {
    return { value: null };
  }

  const nums = extractNumbers(input);

  if (nums.length === 0) return { value: null };
  if (nums.length === 1) return { value: nums[0] };

  const avg = (nums[0] + nums[1]) / 2;
  return { value: Number.isFinite(avg) ? avg : null };
}

export type ParsedPricing = {
  buyZoneLow: number | null;
  buyZoneHigh: number | null;
  takeProfitLow: number | null;
  takeProfitHigh: number | null;
  stopLoss: number | null;
};

/**
 * Parse the trio of LLM-authored strings into the six numeric columns we
 * persist in the DB. Missing values pass through as null so the DB layer
 * can keep the raw text while enforcing numeric guarantees where present.
 */
export function parsePicksPricing(input: {
  buyZone: string | null | undefined;
  takeProfit: string | null | undefined;
  stopLoss: string | null | undefined;
}): ParsedPricing {
  const buy = parseRange(input.buyZone);
  const tp = parseRange(input.takeProfit);
  const sl = parseLevel(input.stopLoss);

  return {
    buyZoneLow: buy.low,
    buyZoneHigh: buy.high,
    takeProfitLow: tp.low,
    takeProfitHigh: tp.high,
    stopLoss: sl.value,
  };
}

/**
 * Compute the signal outcome given a current price and parsed pricing.
 *
 * Rules:
 *   - If currentPrice >= takeProfitLow (lowest TP scale-out), signal hits TP.
 *   - Else if currentPrice <= stopLoss, signal stops out.
 *   - Else signal remains open.
 */
export type SignalDecision = {
  status: "take_profit_hit" | "stop_loss_hit" | "open" | "monitoring";
  outcome: "win" | "loss" | "open";
  closedAt: string | null;
};

export function decideSignal(
  currentPrice: number | null,
  pricing: {
    takeProfitLow: number | null;
    stopLoss: number | null;
  }
): SignalDecision {
  if (currentPrice === null) {
    return { status: "monitoring", outcome: "open", closedAt: null };
  }

  if (
    pricing.takeProfitLow !== null &&
    currentPrice >= pricing.takeProfitLow
  ) {
    return {
      status: "take_profit_hit",
      outcome: "win",
      closedAt: new Date().toISOString(),
    };
  }

  if (pricing.stopLoss !== null && currentPrice <= pricing.stopLoss) {
    return {
      status: "stop_loss_hit",
      outcome: "loss",
      closedAt: new Date().toISOString(),
    };
  }

  return { status: "open", outcome: "open", closedAt: null };
}
