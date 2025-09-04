"use client";

import { useState, useEffect } from "react";

type DrawResult = {
  winners: string[];
  created_at: string;
};

export default function PrizeDrawPage() {
  const [winners, setWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchResults() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/draw", { method: "GET" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch results");

      setWinners(data.winners || []);
    } catch (err: any) {
      setError(`Failed to load results: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function runDraw() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 👇 Quick fix: use NEXT_PUBLIC_ADMIN_KEY for client-side call
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_KEY || ""}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to run draw");

      setWinners(data.winners);
    } catch (err: any) {
      setError(`Failed to run draw: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Prize Draw</h1>
      <p className="text-gray-600 mb-6">
        Season 26 · Three winners · Publicly viewable
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={fetchResults}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Refresh
        </button>
        <button
          onClick={fetchResults}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Show results
        </button>
        <button
          onClick={runDraw}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Run draw (admin)
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-600 p-2 border border-red-300 bg-red-50 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-6 border rounded shadow text-center text-lg font-semibold bg-white"
          >
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : winners[i] ? (
              winners[i]
            ) : (
              <span className="text-gray-400">Winner #{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {winners.length === 0 && !loading && (
        <p className="mt-4 text-gray-500">
          No winners yet. An admin must run the draw once using the button
          above.
        </p>
      )}
    </div>
  );
}