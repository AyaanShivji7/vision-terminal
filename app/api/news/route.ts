import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FINNHUB_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news from Finnhub" },
        { status: 500 }
      );
    }

    const data = await response.json();

    const articles = Array.isArray(data)
      ? data.slice(0, 12).map((item: any, index: number) => ({
          id: item.id ?? index,
          title: item.headline ?? "Untitled article",
          url: item.url ?? "#",
          source: item.source ?? "Unknown",
          datetime: item.datetime ?? 0,
        }))
      : [];

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("News API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while fetching news." },
      { status: 500 }
    );
  }
}