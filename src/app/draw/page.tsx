"use client";

import { useEffect, useState } from "react";

type DrawPayload = { winners: string[]; created_at?: string };

export default function PrizeDrawPage() {
  const [winners, setWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadResults() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/draw", { method: "GET" });
      const data: DrawPayload | { error: string } = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Failed to fetch results");
      setWinners((data as DrawPayload).winners ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  async function runDraw() {
    try {
      setLoading(true);
      setError(null);

      // Ask for the admin password
      const entered = window.prompt("Enter admin password to run the draw:");
      if (!entered) {
        setError("Draw cancelled.");
        return;
      }
      const key = entered.trim();

      const res = await fetch("/api/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Send in both headers to satisfy either server check
          Authorization: `Bearer ${key}`,
          "x-admin-key": key,
        },
      });

      const data: DrawPayload | { error: string } = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Failed to run draw");

      setWinners((data as DrawPayload).winners ?? []);
    } catch (e: any) {
      setError(`Failed to run draw: ${e.message || e.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-1">Prize Draw</h1>
      <p className="text-gray-600 mb-6">Season 26 · Three winners · Publicly viewable</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={loadResults}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Refresh
        </button>
        <button
          onClick={loadResults}
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
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 rounded border bg-white shadow flex items-center justify-center text-lg font-semibold"
          >
            {loading ? (
              <span className="text-gray-400">Loading…</span>
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
          No winners yet. An admin must run the draw once using the button above.
        </p>
      )}
    </div>
  );
}