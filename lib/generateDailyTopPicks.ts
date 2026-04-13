import OpenAI from "openai";
import { sql } from "@/lib/db";
import { getEdmontonDateString } from "@/lib/date";
import { buildMarketContextPrompt, getMarketContext } from "@/lib/marketContext";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GeneratedPick = {
  ticker: string;
  company: string;
  shortReason: string;
  summary: string;
  buyZone: string;
  takeProfit: string;
  stopLoss: string;
  reasoning: string;
  confidenceScore: number;
  riskLevel: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, "");
    return withoutFenceStart.replace(/\s*```$/, "");
  }

  return trimmed;
}

function normalizeRiskLevel(value: string) {
  const cleaned = value.trim().toLowerCase();

  if (cleaned === "low" || cleaned === "medium" || cleaned === "high") {
    return cleaned;
  }

  return "medium";
}

function normalizePicks(raw: unknown): GeneratedPick[] {
  if (!Array.isArray(raw)) {
    throw new Error("Model did not return an array.");
  }

  if (raw.length !== 10) {
    throw new Error("Model did not return exactly 10 picks.");
  }

  return raw.map((item, index) => {
    const pick = item as Record<string, unknown>;

    const confidenceScore = Number(pick.confidenceScore);

    const normalized: GeneratedPick = {
      ticker: String(pick.ticker || "").trim().toUpperCase(),
      company: String(pick.company || "").trim(),
      shortReason: String(pick.shortReason || "").trim(),
      summary: String(pick.summary || "").trim(),
      buyZone: String(pick.buyZone || "").trim(),
      takeProfit: String(pick.takeProfit || "").trim(),
      stopLoss: String(pick.stopLoss || "").trim(),
      reasoning: String(pick.reasoning || "").trim(),
      confidenceScore:
        Number.isFinite(confidenceScore) && confidenceScore >= 1 && confidenceScore <= 100
          ? confidenceScore
          : 65,
      riskLevel: normalizeRiskLevel(String(pick.riskLevel || "medium")),
    };

    if (
      !normalized.ticker ||
      !normalized.company ||
      !normalized.shortReason ||
      !normalized.summary ||
      !normalized.buyZone ||
      !normalized.takeProfit ||
      !normalized.stopLoss ||
      !normalized.reasoning
    ) {
      throw new Error(`Pick ${index + 1} is missing required fields.`);
    }

    return normalized;
  });
}

async function fetchLivePrice(ticker: string) {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY");
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch live price for ${ticker}`);
  }

  const data = await response.json();

  if (!data || typeof data.c !== "number" || data.c <= 0) {
    throw new Error(`Invalid live price for ${ticker}`);
  }

  return Number(data.c);
}

function computeSignalStatus(
  entryPrice: number,
  currentPrice: number,
  takeProfit: string,
  stopLoss: string
) {
  const tpMatch = takeProfit.match(/-?\d+(\.\d+)?/);
  const slMatch = stopLoss.match(/-?\d+(\.\d+)?/);

  const tp = tpMatch ? Number(tpMatch[0]) : null;
  const sl = slMatch ? Number(slMatch[0]) : null;

  if (tp !== null && currentPrice >= tp) {
    return {
      signalStatus: "take_profit_hit",
      outcome: "win",
    };
  }

  if (sl !== null && currentPrice <= sl) {
    return {
      signalStatus: "stop_loss_hit",
      outcome: "loss",
    };
  }

  return {
    signalStatus: "open",
    outcome: "open",
  };
}

export async function generateTopPicksWithOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const marketContext = await getMarketContext();
  const marketContextPrompt = buildMarketContextPrompt(marketContext);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `
You are an equity research assistant for an AI investing terminal.

Return exactly 10 stock picks for today's market watchlist.

Requirements:
- Focus on liquid, legitimate publicly traded stocks
- Mix growth, quality, momentum, and defensive names where appropriate
- Avoid penny stocks
- Keep the output realistic and professional
- Give concise, actionable investor-facing language
- The summary should be about 150 to 200 words
- The shortReason should be short, around 4 to 10 words
- buyZone, takeProfit, and stopLoss should be plain text price ranges or levels
- reasoning should explain clearly why the stock made today's list
- confidenceScore must be an integer from 1 to 100
- riskLevel must be exactly one of: low, medium, high
- Return JSON only
- Do not include markdown fences
- Return an array of exactly 10 objects

Each object must have:
ticker
company
shortReason
summary
buyZone
takeProfit
stopLoss
reasoning
confidenceScore
riskLevel
        `.trim(),
      },
      {
        role: "user",
        content: `
Generate today's top 10 stock ideas for Vision Terminal.

Use this real market context:
${marketContextPrompt}

Output format example:
[
  {
    "ticker": "NVDA",
    "company": "NVIDIA Corporation",
    "shortReason": "AI demand and momentum",
    "summary": "150 to 200 word summary here...",
    "buyZone": "$120 - $126",
    "takeProfit": "$132 - $140",
    "stopLoss": "$116",
    "reasoning": "Why this stock made today's list...",
    "confidenceScore": 82,
    "riskLevel": "medium"
  }
]
        `.trim(),
      },
    ],
    max_tokens: 4500,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no content.");
  }

  const parsed = JSON.parse(extractJson(content));
  return normalizePicks(parsed);
}

export async function saveTodaysGeneratedPicks(picks: GeneratedPick[]) {
  const today = getEdmontonDateString();

  await sql`
    DELETE FROM daily_top_picks
    WHERE pick_date = ${today}
  `;

  for (let i = 0; i < picks.length; i++) {
    const pick = picks[i];

    let entryPrice: number | null = null;
    let currentPrice: number | null = null;
    let signalStatus = "monitoring";
    let outcome = "open";
    let returnPercent = 0;

    try {
      const livePrice = await fetchLivePrice(pick.ticker);
      entryPrice = livePrice;
      currentPrice = livePrice;

      const status = computeSignalStatus(
        entryPrice,
        currentPrice,
        pick.takeProfit,
        pick.stopLoss
      );

      signalStatus = status.signalStatus;
      outcome = status.outcome;
      returnPercent = 0;
    } catch (error) {
      console.error(`Live price fetch failed for ${pick.ticker}:`, error);
    }

    await sql`
      INSERT INTO daily_top_picks (
        id,
        pick_date,
        rank,
        ticker,
        company,
        short_reason,
        summary,
        buy_zone,
        take_profit,
        stop_loss,
        reasoning,
        confidence_score,
        risk_level,
        entry_price,
        current_price,
        signal_status,
        return_percent,
        outcome
      )
      VALUES (
        ${crypto.randomUUID()},
        ${today},
        ${i + 1},
        ${pick.ticker},
        ${pick.company},
        ${pick.shortReason},
        ${pick.summary},
        ${pick.buyZone},
        ${pick.takeProfit},
        ${pick.stopLoss},
        ${pick.reasoning},
        ${pick.confidenceScore},
        ${pick.riskLevel},
        ${entryPrice},
        ${currentPrice},
        ${signalStatus},
        ${returnPercent},
        ${outcome}
      )
    `;
  }

  return {
    success: true,
    date: today,
    count: picks.length,
  };
}

export async function generateAndSaveDailyTopPicks() {
  const picks = await generateTopPicksWithOpenAI();
  const result = await saveTodaysGeneratedPicks(picks);

  return {
    ...result,
    preview: picks.map((pick, index) => ({
      rank: index + 1,
      ticker: pick.ticker,
      company: pick.company,
      confidenceScore: pick.confidenceScore,
      riskLevel: pick.riskLevel,
    })),
  };
}