"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Vision Terminal Assistant.\n\nI can help with market questions, stock ideas, and portfolio insights using your linked holdings when available.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    if (!canSend) return;
    const outgoingMessage = input.trim();

    const userMessage: Message = {
      role: "user",
      content: outgoingMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: outgoingMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.reply || "Error getting response.");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setError("Could not reach the assistant. Please try again.");
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

  function renderAssistantContent(content: string) {
    const sections = content
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter(Boolean);

    return sections.map((section, index) => {
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const isList = lines.length > 1 && lines.every((line) => /^([-*•]|\d+\.)\s+/.test(line));

      if (isList) {
        return (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {lines.map((line, lineIndex) => (
              <li key={lineIndex}>{line.replace(/^([-*•]|\d+\.)\s+/, "")}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={index} className="whitespace-pre-wrap">
          {section}
        </p>
      );
    });
  }

  return (
    <section className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-5">
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

      <div className="mt-5 flex h-[620px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55">
        <div
          ref={scrollContainerRef}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-5"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-7 md:max-w-[82%] ${
                msg.role === "assistant"
                  ? "bg-white/10 text-zinc-100"
                  : "ml-auto bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-3">{renderAssistantContent(msg.content)}</div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          ))}

          {loading && (
            <div className="max-w-[82%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
              <div className="mb-1 flex items-center gap-2 text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-300" />
                Assistant is thinking...
              </div>
              <p className="text-zinc-400">Analyzing context and preparing a response.</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/80 p-4 backdrop-blur">
          <div className="flex items-end gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about stocks, trades, or strategy..."
              className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
            />

            <button
              onClick={sendMessage}
              disabled={!canSend}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
