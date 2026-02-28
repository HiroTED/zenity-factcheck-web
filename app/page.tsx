"use client";

import { useState } from "react";

const SAMPLE_ARTICLE = `日本銀行は2024年3月に政策金利をマイナス0.1%から0.1%に引き上げた。
これは2007年以来初めての利上げとなる。トヨタ自動車の2024年度の
売上高は約45兆円で、世界最大の自動車メーカーとなっている。
日本のEV普及率は2024年時点で約3%程度にとどまっており、
政府は2035年までに新車販売の100%を電動車にする目標を掲げている。`;

function ResultDisplay({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isOk = line.includes("✅");
        const isWarn = line.includes("⚠️");
        const isError = line.includes("❌");

        let colorClass = "text-gray-300";
        if (isOk) colorClass = "text-green-400";
        else if (isWarn) colorClass = "text-yellow-400";
        else if (isError) colorClass = "text-red-400";

        return (
          <p key={i} className={`text-sm leading-relaxed ${colorClass}`}>
            {line}
          </p>
        );
      })}
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
                <ResultDisplay text={result} />
              )}
              {!loading && !error && !result && (
                <p className="text-sm" style={{ color: "#4b5563" }}>
                  ファクトチェックを実行すると、ここに結果が表示されます。
                </p>
              )}
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-xs" style={{ color: "#6b7280" }}>
              <span className="text-green-400">✅ 正確</span>
              <span className="text-yellow-400">⚠️ 要確認</span>
              <span className="text-red-400">❌ 不正確</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
