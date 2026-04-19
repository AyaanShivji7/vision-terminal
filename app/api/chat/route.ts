import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Keep the wire format small but flexible.
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "Message content is required.")
    .max(4000, "Message is too long."),
});

const chatSchema = z.object({
  // New (preferred) shape: full conversation history from the client.
  messages: z.array(messageSchema).min(1).max(40).optional(),
  // Back-compat: older clients still posting { message: "..." }.
  message: z.string().trim().min(1).max(4000).optional(),
});

const SYSTEM_PROMPT =
  "You are an AI trading assistant inside an investment terminal. Be concise, clear, and actionable. Focus on stocks, trading strategy, and market insights. When discussing prices or signals, remind the user that this is not financial advice.";

// Context window cap so we never blow up on very long threads.
const MAX_HISTORY_TURNS = 20;

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

    // Build the conversation. Prefer `messages` array, fall back to single
    // `message` for backward compatibility.
    const historyMessages = parsed.data.messages ?? [];
    const legacyMessage = parsed.data.message;

    if (historyMessages.length === 0 && !legacyMessage) {
      return NextResponse.json(
        { error: "Provide either messages[] or message." },
        { status: 400 }
      );
    }

    const conversation = historyMessages.length
      ? historyMessages.slice(-MAX_HISTORY_TURNS)
      : [{ role: "user" as const, content: legacyMessage as string }];

    // Require the last entry to be a user message - otherwise there is
    // nothing to respond to.
    if (conversation[conversation.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "The last message must be from the user." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat is temporarily unavailable." },
        { status: 503 }
      );
    }

    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversation,
      ],
    });

    // Pipe OpenAI token deltas to the client as a plain text/event-like stream.
    // We emit raw text chunks (not SSE `data:` frames) so the client can just
    // read response.body as a UTF-8 stream and append each chunk to the UI.
    const encoder = new TextEncoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of stream) {
            const token = part.choices?.[0]?.delta?.content;

            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          }
        } catch (error) {
          console.error("Chat stream error:", error);
          controller.enqueue(
            encoder.encode("\n[stream interrupted]")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return NextResponse.json(
      { error: "Error getting response." },
      { status: 500 }
    );
  }
}
