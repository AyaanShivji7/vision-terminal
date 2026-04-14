import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  buildPortfolioContextBlock,
  getActivePortfolioSnapshot,
} from "@/lib/portfolioContext";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function isPortfolioIntent(message: string) {
  const text = message.toLowerCase();
  const keywords = [
    "my portfolio",
    "my holdings",
    "holdings",
    "overexposed",
    "over exposure",
    "concentration",
    "diversification",
    "rebalance",
    "sector risk",
    "biggest risk",
    "reduce",
    "allocate",
    "allocation",
    "portfolio",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { reply: "Please sign in to use the assistant." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { message?: unknown };
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { reply: "Please enter a message." },
        { status: 400 }
      );
    }

    const portfolioSnapshot = await getActivePortfolioSnapshot(userId);
    const portfolioContext = buildPortfolioContextBlock(portfolioSnapshot);

    if (portfolioSnapshot.holdings.length === 0 && isPortfolioIntent(message)) {
      return NextResponse.json({
        reply:
          "I don’t see portfolio holdings yet. Link a brokerage account or add manual holdings, then I can analyze concentration, sector risk, and rebalance ideas.",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Vision Terminal Assistant, a premium customer-facing investing copilot. Write in a clear, human, practical tone. Use short paragraphs and simple bullet lists when helpful. Avoid robotic phrasing, jargon overload, and long dense walls of text. If the user asks about their portfolio, prioritize the provided PORTFOLIO_CONTEXT and do not invent holdings. If holdings are unavailable, clearly say so. Keep normal market-question support and provide actionable next steps when possible.",
        },
        {
          role: "system",
          content: portfolioContext,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 300,
    });

    return NextResponse.json({
      reply: response.choices[0].message.content,
    });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Error getting response.";

    return NextResponse.json(
      { reply: message },
      { status: 500 }
    );
  }
}
