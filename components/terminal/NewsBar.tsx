"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type NewsArticle = {
  id: number;
  title: string;
  url: string;
  source: string;
  datetime: number;
};

function formatTime(timestamp: number) {
  if (!timestamp) return "Recent";

  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function isNewArticle(timestamp: number) {
  if (!timestamp) return false;

  const now = Date.now();
  const published = timestamp * 1000;
  const diffHours = (now - published) / (1000 * 60 * 60);

  return diffHours <= 12;
}

export default function NewsBar() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/news");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load news");
        }

        setArticles(data.articles || []);
      } catch {
        setError("Unable to load market news.");
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  const visibleArticles = useMemo(() => articles.slice(0, 10), [articles]);

  useEffect(() => {
    if (loading || error || visibleArticles.length === 0 || isPaused) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const firstCard = container.querySelector<HTMLElement>("[data-news-card='true']");
      if (!firstCard) return;

      const cardStyle = window.getComputedStyle(firstCard);
      const gap = parseFloat(cardStyle.marginRight || "0");
      const scrollAmount = firstCard.offsetWidth + gap + 12;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const nextScrollLeft = container.scrollLeft + scrollAmount;

      if (nextScrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        container.scrollTo({
          left: nextScrollLeft,
          behavior: "smooth",
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, error, visibleArticles, isPaused]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Market News Feed
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Live Market Headlines
          </h2>
        </div>

        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          Live Feed
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-400">
          Loading market headlines...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex min-w-max gap-3 pb-2">
            {visibleArticles.map((article) => {
              const newArticle = isNewArticle(article.datetime);

              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  data-news-card="true"
                  className={`block min-w-[320px] rounded-2xl border px-4 py-4 text-left transition ${
                    newArticle
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-black/40 text-white hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-medium leading-6">{article.title}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p
                      className={`text-xs uppercase tracking-wider ${
                        newArticle ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      {article.source}
                    </p>

                    <p
                      className={`text-xs ${
                        newArticle ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      {formatTime(article.datetime)}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}