import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message is too long."),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid chat payload." },
        { status: 400 }
      );
    }

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
          content: parsed.data.message,
        },
      ],
      max_tokens: 300,
    });

    return NextResponse.json({
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return NextResponse.json(
      { reply: "Error getting response." },
      { status: 500 }
    );
  }
}
