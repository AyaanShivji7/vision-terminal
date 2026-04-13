"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Day-Trader. Ask about stocks, your portfolio, or market trends.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error getting response.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <section className="h-full rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            AI Assistant
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Day-Trader
          </h2>
        </div>
      </div>

      <div className="mt-5 flex h-[620px] flex-col rounded-2xl border border-white/10 bg-black/50">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "assistant"
                  ? "bg-white/10 text-white"
                  : "ml-auto bg-white text-black"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="text-sm text-zinc-400">Thinking...</div>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about stocks, trades, or strategy..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
            />

            <button
              onClick={sendMessage}
              className="rounded-xl bg-white px-5 py-3 text-black"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}