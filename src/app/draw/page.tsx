"use client";

import { useState } from "react";
import Section from "@/components/Section";

export default function PrizeDrawPage() {
  const [winners, setWinners] = useState<string[]>([]);   // filled by API or import
  const [revealed, setRevealed] = useState(false);        // toggled after animation
  const loading = winners.length === 0;                   // true until fetch completes

  const handleShowResults = () => {
    // TODO: Replace this with your real fetch/import
    setTimeout(() => {
      setWinners(["Alice", "Bob", "Cara"]); // fake data for demo
      setRevealed(true);
    }, 1000);
  };

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-white">
        Prize Draw
      </h1>
      <p className="mb-6 text-gray-400">
        Season 26 · Three winners · Publicly viewable
      </p>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
        >
          Refresh
        </button>
        <button onClick={handleShowResults} className="btn btn-primary">
          Show results
        </button>
      </div>

      <Section title="Results">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => {
            const name = winners[i];
            const showShimmer = !revealed || !name;

            return (
              <div
                key={i}
                className={`card p-6 h-28 flex items-center justify-center text-center ${
                  showShimmer ? "shimmer" : ""
                }`}
              >
                <div className="text-white/80">
                  <div className="text-xs uppercase tracking-wide mb-1">
                    Winner #{i + 1}
                  </div>
                  <div className="text-lg font-semibold">
                    {loading ? "Loading…" : name ?? "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Official ticket">
        <p className="text-gray-300">
          External draw ticket (RandomResult, etc.) can be embedded here.
        </p>
      </Section>
    </>
  );
}