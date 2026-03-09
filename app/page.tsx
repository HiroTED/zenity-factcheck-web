"use client";

import { useState } from "react";

const SAMPLE_ARTICLE = `日本銀行は2024年3月に政策金利をマイナス0.1%から0.1%に引き上げた。
これは2007年以来初めての利上げとなる。トヨタ自動車の2024年度の
売上高は約45兆円で、世界最大の自動車メーカーとなっている。
日本のEV普及率は2024年時点で約3%程度にとどまっており、
政府は2035年までに新車販売の100%を電動車にする目標を掲げている。`;

function ResultDisplay({ text, originalArticle }: { text: string; originalArticle: string }) {
  let parsed: {
    segments: { text: string; status: string; correction?: string }[];
    improvements: string[];
  } | null = null;

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    // fallback to plain text
  }

  if (!parsed) {
    return (
      <div className="space-y-2">
        {text.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-gray-300">{line}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Article with highlights */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          記事チェック結果
        </p>
        <div className="text-sm leading-loose">
          {parsed.segments.map((seg, i) => {
            if (seg.status === "incorrect") {
              return (
                <span key={i} className="relative group">
                  <span className="text-red-400 underline decoration-dotted cursor-help">
                    {seg.text}
                  </span>
                  {seg.correction && (
                    <span className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs text-white rounded z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: "#ef4444" }}>
                      ✗ {seg.correction}
                    </span>
                  )}
                </span>
              );
            } else if (seg.status === "unverified") {
              return (
                <span key={i} className="text-yellow-400">
                  {seg.text}
                </span>
              );
            } else {
              return (
                <span key={i} className="text-gray-300">
                  {seg.text}
                </span>
              );
            }
          })}
        </div>
      </div>

      {/* Improvements */}
      {parsed.improvements && parsed.improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            改善事項
          </p>
          <div className="space-y-2">
            {parsed.improvements.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm"
                style={{ backgroundColor: "#1a1a2e", borderLeft: "3px solid #f97316", padding: "8px 12px", borderRadius: "4px" }}>
                <span className="text-orange-400 font-bold">{i + 1}.</span>
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs pt-2 border-t" style={{ borderColor: "#1e1e2e", color: "#6b7280" }}>
        <span className="text-gray-300">■ 正確</span>
        <span className="text-yellow-400">■ 未確認</span>
        <span className="text-red-400">■ 不正確（ホバーで詳細）</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [article, setArticle] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!article.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/factcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult(data.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* Header */}
      <header
        className="border-b px-8 py-5"
        style={{ borderColor: "#1e1e2e", backgroundColor: "#0d0d1a" }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          📰 FactCheck AI
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          AI powered by Amazon Bedrock
        </p>
      </header>

      {/* Main content */}
      <main className="px-8 py-8">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Left panel — 60% */}
          <div className="w-3/5 flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-300">
              Blog記事を貼り付けてください
            </label>
            <textarea
              value={article}
              onChange={(e) => setArticle(e.target.value)}
              placeholder="記事のテキストをここに貼り付けてください..."
              className="w-full rounded-lg p-4 text-sm text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                minHeight: "300px",
                backgroundColor: "#111120",
                border: "1px solid #1e1e2e",
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setArticle(SAMPLE_ARTICLE)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:brightness-125"
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "#9ca3af",
                  border: "1px solid #2e2e3e",
                }}
              >
                サンプル記事を挿入
              </button>
              <button
                onClick={handleCheck}
                disabled={loading || !article.trim()}
                className="px-6 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: "#3b82f6", color: "#ffffff" }}
              >
                🔍 ファクトチェック開始
              </button>
            </div>
          </div>

          {/* Right panel — 40% */}
          <div className="w-2/5 flex flex-col gap-4">
            <label className="text-sm font-medium text-gray-300">
              チェック結果
            </label>
            <div
              className="rounded-lg p-5 flex-1"
              style={{
                minHeight: "300px",
                backgroundColor: "#111120",
                border: "1px solid #1e1e2e",
              }}
            >
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-16">
                  <div
                    className="w-8 h-8 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "#3b82f6",
                      borderTopColor: "transparent",
                    }}
                  />
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    AIが記事を検証中...
                  </p>
                </div>
              )}
              {!loading && error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              {!loading && !error && result && (
                <ResultDisplay text={result} originalArticle={article} />
              )}
              {!loading && !error && !result && (
                <p className="text-sm" style={{ color: "#4b5563" }}>
                  ファクトチェックを実行すると、ここに結果が表示されます。
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
