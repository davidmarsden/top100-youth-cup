"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { load, save } from "@/lib/utils";
import type { DrawRecord } from "@/lib/types";

// Hard-coded eligible managers for this draw (as provided)
const ELIGIBLE: string[] = [
  "Walter Gogh",
  "Heath Brown",
  "Chris Taylor",
  "Gav Harmer",
  "Adam",
  "Bojan",
  "Yamil Mc02",
  "Hugo Costa",
  "James McKenzie",
  "Carl Martin",
  "Ash L",
  "Chris Meida",
  "Dario Saviano",
  "Chris Baggio",
  "Glen Mullan",
  "David Marsden",
  "Regan Thompson",
  "Doug Earle",
  "Marco G",
  "Steven Allington",
  "Dan Wallace",
  "Simon Thomas",
  "Jay Jones (Gladbach, now Monaco)",
  "Ricardo Ferreira",
  "Scott Mckenzie",
  "Paul Masters",
  "Mr TRX",
  "Pedro Vilar",
  "Neil Frankland",
  "Fredrik Johansson (Wolfsburg, now Sporting)",
];

// Simple cryptographically-strong picker
function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("Empty pool");
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const idx = buf[0] % arr.length;
  return arr[idx]!;
}

// In future we’ll compute eligibility from forfeits.
// Keep a single place to flip that logic.
function isEligible(name: string): boolean {
  return ELIGIBLE.includes(name);
}

const HISTORY_KEY = "yc:draw-history";

export default function PrizeDrawPage() {
  const [pool, setPool] = useState<string[]>([]);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [busy, setBusy] = useState(false);

  // Bootstrap pool + history
  useEffect(() => {
    (async () => {
      const hist = (await load<DrawRecord[]>(HISTORY_KEY)) ?? [];
      setHistory(hist);
      setPool(ELIGIBLE.filter(isEligible));
    })();
  }, []);

  const remaining = useMemo(() => {
    if (history.length === 0) return pool;
    // Allow repeats across draws but show what's still un-won this session.
    const winners = new Set(history.map(h => h.winner));
    return pool.filter(p => !winners.has(p));
  }, [pool, history]);

  const draw = async () => {
    if (busy) return;
    if (pool.length === 0) return;

    setBusy(true);
    try {
      const entries = pool.slice();
      const winner = pickRandom(entries);

      const rec: DrawRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        entries,
        winner,
        seed: null, // placeholder for future seeded draws
      };

      const nextHistory = [rec, ...history];
      setHistory(nextHistory);
      setLastWinner(winner);
      await save(HISTORY_KEY, nextHistory);
    } finally {
      setBusy(false);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    setLastWinner(null);
    await save(HISTORY_KEY, []);
  };

  return (
    <>
      <header className="space-y-1 mb-8">
        <h1 className="text-3xl font-bold">Prize Draw</h1>
        <p className="text-sm text-gray-500">Instant draw from eligible managers</p>
        <p className="text-xs text-gray-500">
          <Link href="/" className="underline">← Back to Home</Link>
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Controls + Live result */}
        <section className="space-y-4">
          <div className="p-4 rounded-lg bg-white shadow-sm border">
            <h2 className="text-lg font-semibold">Draw a Winner</h2>
            <p className="text-sm text-gray-600">
              Pool size: <strong>{pool.length}</strong> • Remaining (not yet drawn this session):{" "}
              <strong>{remaining.length}</strong>
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={draw}
                disabled={busy || pool.length === 0}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Drawing…" : "Pick winner"}
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Clear history
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Last winner</p>
              <p className="text-2xl font-bold">{lastWinner ?? "—"}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white shadow-sm border">
            <h3 className="text-md font-semibold mb-2">Eligible managers</h3>
            <ul className="list-disc ml-6 text-sm">
              {pool.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right: History */}
        <section className="space-y-3">
          <div className="p-4 rounded-lg bg-white shadow-sm border">
            <h2 className="text-lg font-semibold">Draw history</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No draws yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[520px] text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="pr-4">When</th>
                      <th className="pr-4">Winner</th>
                      <th className="pr-4">Pool size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id}>
                        <td className="pr-4">{new Date(h.at).toLocaleString()}</td>
                        <td className="pr-4 font-medium">{h.winner}</td>
                        <td className="pr-4">{h.entries.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Future-ready: eligibility will be computed from forfeits; this page already
            centralizes that check in <code>isEligible()</code>.
          </p>
        </section>
      </div>
    </>
  );
}