'use client';

import React, { useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { useAdmin } from '@/components/AdminGate';

// simple, deterministic PRNG from seed string
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export default function PrizeDrawPage() {
  const { admin } = useAdmin();

  const [seed, setSeed] = useState(
    () => `S26-${new Date().toISOString().slice(0, 10)}`
  );

  const [raw, setRaw] = useState<string>('');

  // canonicalize lines to unique managers (trim, collapse whitespace)
  const canonical = useMemo(() => {
    const lines = raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of lines) {
      const name = line.replace(/\s+/g, ' ');
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(name);
      }
    }
    return result;
  }, [raw]);

  const fullOrder = useMemo(() => {
    const arr = [...canonical];
    if (!arr.length) return arr;
    const rnd = mulberry32(hashString(seed));
    // Fisher-Yates with deterministic rnd
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [canonical, seed]);

  const [revealed, setRevealed] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  async function startDraw() {
    if (!admin) return alert('Admin only.');
    if (fullOrder.length < 3) return alert('Need at least 3 eligible managers.');
    setRevealed([]);
    setRunning(true);

    // reveal first 3 one-by-one (the winners), then stop
    const winners = fullOrder.slice(0, 3);
    for (const w of winners) {
      // tiny delay for theatre
      // biome-ignore lint/suspicious/noAwaitInLoop: reveal with pauses
      await new Promise((r) => setTimeout(r, 900));
      setRevealed((prev) => [...prev, w]);
    }
    setRunning(false);
  }

  function copyAnnouncement() {
    const winners = fullOrder.slice(0, 3);
    const text =
      `🎁 Top 100 Youth Cup — Prize Draw (Season S26)\n\n` +
      `Seed: ${seed}\n` +
      `Winners:\n1) ${winners[0] ?? '—'}\n2) ${winners[1] ?? '—'}\n3) ${winners[2] ?? '—'}\n\n` +
      `(Deterministic, reproducible shuffle. Full order available on the site.)`;
    navigator.clipboard?.writeText(text);
    alert('Copied announcement to clipboard.');
  }

  const winnersPreview = fullOrder.slice(0, 3);

  const inputDisabled = !admin || running;
  const actionDisabled = !admin || running || fullOrder.length < 3;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title="Prize Draw — Input">
        {!admin && (
          <p className="mb-3 text-sm opacity-80">
            You are viewing in <strong>non-admin</strong> mode. Admins can paste the eligible list,
            set a public seed, and run the draw. Please ask the organiser to sign in.
          </p>
        )}

        <label className="block text-sm opacity-80 mb-1">Seed (public & reproducible)</label>
        <input
          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 mb-3"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          disabled={inputDisabled}
        />
        <p className="text-xs opacity-70 mb-2">
          Tip: include Season + ISO date/time (e.g., <code>S26-2025-09-05T21:00Z</code>).
        </p>

        <label className="block text-sm opacity-80 mb-1">Eligible names (one per line)</label>
        <textarea
          className="w-full min-h-[220px] px-3 py-2 rounded-xl bg-white/10 border border-white/20"
          placeholder="Paste manager names here..."
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          disabled={inputDisabled}
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            className="btn"
            onClick={copyAnnouncement}
            disabled={fullOrder.length < 3}
            title={fullOrder.length < 3 ? 'Need at least 3 names' : 'Copy announcement text'}
          >
            Copy Announcement
          </button>

          {/* Admin-only controls */}
          {admin && (
            <>
              <button
                className="btn bg-white text-black"
                onClick={startDraw}
                disabled={actionDisabled}
                title={!admin ? 'Admin only' : undefined}
              >
                🎲 Start Draw
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!admin) return;
                  const blob = new Blob(
                    [JSON.stringify({ seed, canonical, fullOrder }, null, 2)],
                    { type: 'application/json' }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `prize-draw-S26-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={fullOrder.length === 0}
              >
                Export Signed JSON
              </button>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Theatre & Results">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-3">
          <div className="text-lg font-semibold">
            {running ? 'Drawing…' : revealed.length ? 'Winners' : 'Ready?'}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Revealed Winners</h3>
          {!revealed.length ? (
            <p className="text-sm opacity-80">Press “Start Draw” to reveal winners one by one.</p>
          ) : (
            <ol className="list-decimal list-inside space-y-1">
              {revealed.map((w) => (
                <li key={w} className="text-lg">{w}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Full shuffled order (deterministic)</h3>
          {fullOrder.length ? (
            <ol className="list-decimal list-inside text-sm space-y-0.5 max-h-64 overflow-auto">
              {fullOrder.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm opacity-80">Provide names to generate a list.</p>
          )}
        </div>

        {!admin && fullOrder.length >= 3 && (
          <div className="mt-3 text-sm opacity-80">
            <p>
              Winners preview (first 3 in the deterministic order):{' '}
              <strong>{winnersPreview.join(', ')}</strong>
            </p>
            <p>Only admins can trigger the reveal animation and export.</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}