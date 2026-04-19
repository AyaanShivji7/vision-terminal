"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const GREETING: Message = {
  role: "assistant",
  content:
    "Welcome to Day-Trader. Ask about stocks, your portfolio, or market trends.",
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll to the bottom whenever the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
    };

    // Snapshot the conversation we'll send (excluding the seed greeting).
    const historyForApi = [...messages, userMessage].filter(
      (msg, index) => !(index === 0 && msg === GREETING)
    );

    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Stream tokens into the trailing placeholder assistant message.
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            const last = next[lastIndex];

            if (last && last.role === "assistant") {
              next[lastIndex] = {
                ...last,
                content: last.content + chunk,
              };
            }

            return next;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        const last = next[lastIndex];

        if (last && last.role === "assistant" && last.content === "") {
          next[lastIndex] = {
            role: "assistant",
            content: "Error getting response.",
          };
        } else {
          next.push({
            role: "assistant",
            content: "Error getting response.",
          });
        }

        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setMessages([GREETING]);
    setInput("");
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
        <button
          onClick={resetConversation}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-zinc-400 transition hover:border-white/30 hover:text-white"
          disabled={loading}
        >
          New chat
        </button>
      </div>

      <div className="mt-5 flex h-[620px] flex-col rounded-2xl border border-white/10 bg-black/50">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto p-4"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                msg.role === "assistant"
                  ? "bg-white/10 text-white"
                  : "ml-auto bg-white text-black"
              }`}
            >
              {msg.content ||
                (loading && index === messages.length - 1 ? "…" : "")}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about stocks, trades, or strategy..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
              disabled={loading}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-white px-5 py-3 text-black transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
