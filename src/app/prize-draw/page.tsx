'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { useAdmin } from '@/components/AdminGate';
import { isSupabase } from '@/lib/mode';

/* deterministic PRNG */
function mulberry32(a: number) { return function () { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashString(str: string) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }

const SEASON = 'S26'; // or pull from settings if you store it globally

type DrawState = {
  season: string;
  seed: string;
  canonical: string[];
  full_order: string[];
  revealed: number;
};

const LS_KEY = (s: string) => `yc:prize:${s}`;

export default function PrizeDrawPage() {
  const { admin } = useAdmin();

  // page-local inputs
  const [seed, setSeed] = useState(() => `${SEASON}-${new Date().toISOString().slice(0, 10)}`);
  const [raw, setRaw] = useState('');

  // persisted state (from DB or localStorage)
  const [persisted, setPersisted] = useState<DrawState | null>(null);

  // Load persisted draw on mount
  useEffect(() => {
    (async () => {
      if (isSupabase) {
        const r = await fetch(`/api/prize-draw?season=${encodeURIComponent(SEASON)}`);
        const { draw } = await r.json();
        if (draw) setPersisted(draw);
      } else {
        const s = localStorage.getItem(LS_KEY(SEASON));
        if (s) setPersisted(JSON.parse(s));
      }
    })();
  }, []);

  // Canonicalize user paste
  const canonicalFromInput = useMemo(() => {
    const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
    const seen = new Set<string>(); const out: string[] = [];
    for (const line of lines) {
      const name = line.replace(/\s+/g, ' ');
      const key = name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(name); }
    }
    return out;
  }, [raw]);

  // If we have persisted full_order, show that; otherwise compute from current input+seed
  const fullOrder = useMemo(() => {
    if (persisted?.full_order?.length) return persisted.full_order;
    const arr = [...canonicalFromInput];
    if (!arr.length) return arr;
    const rnd = mulberry32(hashString(seed));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [persisted?.full_order, canonicalFromInput, seed]);

  const revealedCount = persisted?.revealed ?? 0;
  const revealedWinners = fullOrder.slice(0, Math.min(3, revealedCount));
  const winnersPreview  = fullOrder.slice(0, 3);

  const [running, setRunning] = useState(false);

  async function persist(newState: DrawState) {
    if (isSupabase) {
      await fetch('/api/prize-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
    } else {
      localStorage.setItem(LS_KEY(SEASON), JSON.stringify(newState));
    }
    setPersisted(newState);
  }

  async function startDraw() {
    if (!admin) return alert('Admin only.');
    if (fullOrder.length < 3) return alert('Need at least 3 eligible managers.');

    // Save initial full draw (revealed=0) so everyone can see order immediately
    const initial: DrawState = {
      season: SEASON,
      seed,
      canonical: persisted?.canonical?.length ? persisted.canonical : canonicalFromInput,
      full_order: fullOrder,
      revealed: 0,
    };
    await persist(initial);

    setRunning(true);
    // reveal first 3 one-by-one and persist each step
    for (let i = 1; i <= 3; i++) {
      // pause for theatre
      // biome-ignore lint/suspicious/noAwaitInLoop
      await new Promise(r => setTimeout(r, 900));
      await persist({ ...initial, revealed: i });
    }
    setRunning(false);
  }

  function copyAnnouncement() {
    const winners = fullOrder.slice(0, 3);
    const text =
      `🎁 Top 100 Youth Cup — Prize Draw (${SEASON})\n\n` +
      `Seed: ${persisted?.seed ?? seed}\n` +
      `Winners:\n1) ${winners[0] ?? '—'}\n2) ${winners[1] ?? '—'}\n3) ${winners[2] ?? '—'}\n\n` +
      `(Deterministic, reproducible shuffle. Full order on the site.)`;
    navigator.clipboard?.writeText(text);
    alert('Copied announcement.');
  }

  const inputDisabled  = (!admin || running) && !!persisted?.full_order?.length; // lock after publish
  const actionDisabled = !admin || running || fullOrder.length < 3;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title="Prize Draw — Input">
        {!admin && (
          <p className="mb-3 text-sm opacity-80">
            Viewer mode. You can see the latest results and full order below.
          </p>
        )}

        <label className="block text-sm opacity-80 mb-1">Seed (public & reproducible)</label>
        <input
          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 mb-3"
          value={persisted?.seed ?? seed}
          onChange={(e) => setSeed(e.target.value)}
          disabled={inputDisabled || !!persisted}
        />
        <p className="text-xs opacity-70 mb-2">
          Tip: include Season + ISO date/time (e.g., <code>{SEASON}-2025-09-05T21:00Z</code>).
        </p>

        <label className="block text-sm opacity-80 mb-1">Eligible names (one per line)</label>
        <textarea
          className="w-full min-h-[220px] px-3 py-2 rounded-xl bg-white/10 border border-white/20"
          placeholder="Paste manager names here..."
          value={persisted ? (persisted.canonical ?? []).join('\n') : raw}
          onChange={(e) => setRaw(e.target.value)}
          disabled={inputDisabled || !!persisted}
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            className="btn"
            onClick={copyAnnouncement}
            disabled={fullOrder.length < 3}
          >
            Copy Announcement
          </button>

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
              {persisted && (
                <button
                  className="btn border-red-400 hover:bg-red-400/20"
                  onClick={async () => {
                    if (!confirm('Reset this season’s prize draw?')) return;
                    if (isSupabase) await fetch('/api/prize-draw', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        season: SEASON, seed: `${SEASON}-${new Date().toISOString()}`,
                        canonical: [], full_order: [], revealed: 0
                      }),
                    });
                    else localStorage.removeItem(LS_KEY(SEASON));
                    setPersisted(null);
                    setRaw('');
                  }}
                >
                  Reset Draw
                </button>
              )}
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Theatre & Results">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 mb-3">
          <div className="text-lg font-semibold">
            {running ? 'Drawing…' : revealedCount >= 3 ? 'Winners' : 'Ready?'}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Revealed Winners</h3>
          {!revealedCount ? (
            <p className="text-sm opacity-80">Admin will reveal winners shortly.</p>
          ) : (
            <ol className="list-decimal list-inside space-y-1">
              {revealedWinners.map((w) => (
                <li key={w} className="text-lg">{w}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Full shuffled order (deterministic)</h3>
          {fullOrder.length ? (
            <ol className="list-decimal list-inside text-sm space-y-0.5 max-h-64 overflow-auto">
              {fullOrder.map((n) => (<li key={n}>{n}</li>))}
            </ol>
          ) : (
            <p className="text-sm opacity-80">Awaiting the official list.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}