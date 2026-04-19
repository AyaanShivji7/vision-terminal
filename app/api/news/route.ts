import { NextResponse } from "next/server";
import { getNews } from "@/lib/finnhub";

export async function GET() {
  try {
    const news = await getNews();

    const articles = news.slice(0, 12).map((item, index) => ({
      id: item.id ?? index,
      title: item.headline || "Untitled article",
      url: item.url || "#",
      source: item.source || "Unknown",
      datetime: item.datetime ?? 0,
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("News API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while fetching news." },
      { status: 500 }
    );
  }
}
