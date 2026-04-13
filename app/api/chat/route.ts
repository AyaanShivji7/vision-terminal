import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI trading assistant inside an investment terminal. Be concise, clear, and actionable. Focus on stocks, trading strategy, and market insights.",
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
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { reply: "Error getting response." },
      { status: 500 }
    );
  }
}