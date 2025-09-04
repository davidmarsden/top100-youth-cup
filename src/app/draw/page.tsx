"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApiResponse = { season: string; winners: string[]; at: string | null };

export default function PrizeDrawPage() {
  const [season, setSeason] = useState<string>("26");
  const [loaded, setLoaded] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<number>(0); // 0..3
  const [at, setAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch results (public)
  async function fetchResults() {
    setError(null);
    const res = await fetch("/api/draw", { cache: "no-store" });
    if (!res.ok) {
      setError("Failed to load results.");
      return;
    }
    const data: ApiResponse = await res.json();
    setSeason(data.season);
    setWinners(data.winners ?? []);
    setAt(data.at ?? null);
    setLoaded(true);
  }

  useEffect(() => {
    fetchResults();
  }, []);

  // Public reveal: flip 3 cards with a little drama
  const startReveal = async () => {
    if (winners.length !== 3) return;
    setRevealed(0);
    const step = async (i: number) =>
      new Promise<void>((r) => setTimeout(() => r(), i === 0 ? 800 : 1000));
    for (let i = 0; i < 3; i++) {
      await step(i);
      setRevealed((n) => Math.min(3, n + 1));
    }
  };

  // Admin: trigger the draw on the server (only once)
  const runDraw = async () => {
    const adminKey = window.prompt("Enter admin key to run the draw:");
    if (!adminKey) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      if (res.status === 409) {
        setError("Draw already completed.");
      } else if (!res.ok) {
        const txt = await res.text();
        setError(`Failed to run draw: ${txt}`);
      } else {
        const data: ApiResponse = await res.json();
        setWinners(data.winners ?? []);
        setAt(data.at ?? null);
        setRevealed(0);
      }
    } finally {
      setBusy(false);
    }
  };

  const canReveal = winners.length === 3;

  return (
    <>
      <style
        // Small CSS for the card flip + confetti without extra libs
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pop { 0%{transform:scale(.9);opacity:.2} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes float { 0%{transform:translateY(0)} 100%{transform:translateY(-12px)} }
        .card {
          transition: transform .5s ease, box-shadow .5s ease;
          transform-style: preserve-3d;
        }
        .card.revealed { transform: rotateX(0deg) scale(1); animation: pop .4s ease; }
        .card.cover { transform: rotateX(180deg); }
        .spark { animation: float 1.2s ease-in-out infinite alternate; }
      `,
        }}
      />
      <header className="space-y-1 mb-8">
        <h1 className="text-3xl font-bold">Prize Draw</h1>
        <p className="text-sm text-gray-500">
          Season {season} • Three winners • Publicly viewable
        </p>
        <p className="text-xs text-gray-500">
          <Link href="/" className="underline">
            ← Back to Home
          </Link>
        </p>
      </header>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={fetchResults}
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Refresh
        </button>

        <button
          onClick={startReveal}
          disabled={!canReveal}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Show results
        </button>

        <button
          onClick={runDraw}
          disabled={busy}
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          title="Admin only"
        >
          {busy ? "Running…" : "Run draw (admin)"}
        </button>

        {at && (
          <span className="text-xs text-gray-500">
            Drawn: {new Date(at).toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Theatre: three flipping cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => {
          const show = revealed > i && winners[i];
          const name = winners[i] ?? "—";
          return (
            <div
              key={i}
              className="relative h-40 sm:h-48 perspective-1000 select-none"
            >
              <div
                className={`card absolute inset-0 rounded-xl border bg-white shadow-sm grid place-items-center text-center ${
                  show ? "revealed" : "cover"
                }`}
                style={{
                  backfaceVisibility: "hidden",
                }}
              >
                {show ? (
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">Winner #{i + 1}</div>
                    <div className="text-xl sm:text-2xl font-bold">{name}</div>
                    {/* simple confetti-ish sparks */}
                    <div className="mt-2 text-lg">
                      <span className="spark inline-block mx-1">🎉</span>
                      <span
                        className="spark inline-block mx-1"
                        style={{ animationDelay: ".2s" }}
                      >
                        🎊
                      </span>
                      <span
                        className="spark inline-block mx-1"
                        style={{ animationDelay: ".4s" }}
                      >
                        🥳
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="opacity-70">
                    <div className="text-sm text-gray-500">Winner #{i + 1}</div>
                    <div className="text-3xl">?</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Helper text */}
      {!loaded && (
        <p className="mt-6 text-sm text-gray-500">Loading results…</p>
      )}
      {loaded && winners.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          No winners yet. An admin must run the draw once using the button above.
        </p>
      )}
    </>
  );
}