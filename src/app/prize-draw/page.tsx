'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Minimal, strict-TS data model kept local to avoid cross-file type drift.
 */
type SeasonCode = `S${number}`;

type Forfeit = {
  season: SeasonCode;            // e.g. 'S25'
  reason?: string;               // optional human note
  permanent?: boolean;           // if true => ineligible forever
  expiresAfterSeasons?: number;  // rolling ban window (e.g. 1, 2, 3 seasons)
};

type Manager = {
  name: string;
  club?: string | null;
  forfeits?: Forfeit[];          // empty/omitted means no forfeits
};

/**
 * Config
 */
const CURRENT_SEASON: SeasonCode = 'S26';
const STORAGE_KEY = 'yc:prizedraw:last';

/**
 * Helpers
 */
function seasonToNum(s: SeasonCode): number {
  // 'S26' -> 26
  return Number(s.slice(1));
}

function isEligible(m: Manager, current: SeasonCode): boolean {
  const fs = m.forfeits ?? [];
  if (fs.length === 0) return true;

  const cur = seasonToNum(current);

  for (const f of fs) {
    if (f.permanent) return false;
    if (seasonToNum(f.season) === cur) return false; // active forfeit this season
    if (typeof f.expiresAfterSeasons === 'number') {
      const bannedUntil = seasonToNum(f.season) + f.expiresAfterSeasons;
      if (cur <= bannedUntil) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[], rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function copy(text: string) {
  void navigator.clipboard.writeText(text);
}

/**
 * Hard-coded managers (your list). Clubs kept as plain text comments when given.
 * Forfeits are empty for now; future: push forfeit records here or fetch from DB.
 */
const BASE_MANAGERS: Manager[] = [
  { name: 'Walter Gogh' },
  { name: 'Heath Brown' },
  { name: 'Chris Taylor' },
  { name: 'Gav Harmer' },
  { name: 'Adam' },
  { name: 'Bojan' },
  { name: 'Yamil Mc02' },
  { name: 'Hugo Costa' },
  { name: 'James McKenzie' },
  { name: 'Carl Martin' },
  { name: 'Ash L' },
  { name: 'Chris Meida' },
  { name: 'Dario Saviano' },
  { name: 'Chris Baggio' },
  { name: 'Glen Mullan' },
  { name: 'David Marsden' },
  { name: 'Regan Thompson' },
  { name: 'Doug Earle' },
  { name: 'Marco G' },
  { name: 'Steven Allington' },
  { name: 'Dan Wallace' },
  { name: 'Simon Thomas' },
  { name: 'Jay Jones (Gladbach, now Monaco)' },
  { name: 'Ricardo Ferreira' },
  { name: 'Scott Mckenzie' },
  { name: 'Paul Masters' },
  { name: 'Mr TRX' },
  { name: 'Pedro Vilar' },
  { name: 'Neil Frankland' },
  { name: 'Fredrik Johansson (Wolfsburg, now Sporting)' },
];

/**
 * Light styles; uses your Tailwind setup from the repo.
 */
export default function PrizeDrawPage() {
  const [managers, setManagers] = useState<Manager[]>(BASE_MANAGERS);
  const [respectForfeits, setRespectForfeits] = useState<boolean>(true);
  const [winnersCount, setWinnersCount] = useState<number>(4);
  const [drawn, setDrawn] = useState<Manager[]>([]);
  const [seed, setSeed] = useState<string>('');
  const [extrasText, setExtrasText] = useState<string>('');

  // Load last draw (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        managers: Manager[];
        respectForfeits: boolean;
        winnersCount: number;
        drawn: Manager[];
        seed: string;
        extrasText: string;
      };
      // Only hydrate if shape looks sane:
      if (Array.isArray(parsed.managers)) {
        setManagers(parsed.managers);
        setRespectForfeits(parsed.respectForfeits ?? true);
        setWinnersCount(
          typeof parsed.winnersCount === 'number' ? parsed.winnersCount : 4,
        );
        setDrawn(Array.isArray(parsed.drawn) ? parsed.drawn : []);
        setSeed(typeof parsed.seed === 'string' ? parsed.seed : '');
        setExtrasText(typeof parsed.extrasText === 'string' ? parsed.extrasText : '');
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  // Derived: eligible vs ineligible lists
  const eligible = useMemo(
    () => managers.filter((m) => !respectForfeits || isEligible(m, CURRENT_SEASON)),
    [managers, respectForfeits],
  );
  const ineligible = useMemo(
    () => managers.filter((m) => respectForfeits && !isEligible(m, CURRENT_SEASON)),
    [managers, respectForfeits],
  );

  // Optional deterministic RNG if seed provided (simple LCG)
  const seededRandom = useMemo(() => {
    if (!seed) return undefined;
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return () => {
      // LCG constants (Numerical Recipes)
      s = (1664525 * s + 1013904223) >>> 0;
      return (s & 0xfffffff) / 0x10000000;
    };
  }, [seed]);

  const runDraw = useCallback(() => {
    const pool = eligible.slice();
    const shuffled = shuffle(pool, seededRandom ?? Math.random);
    const winners = shuffled.slice(0, Math.max(0, Math.min(winnersCount, shuffled.length)));
    setDrawn(winners);

    // Persist snapshot
    const snapshot = {
      managers,
      respectForfeits,
      winnersCount,
      drawn: winners,
      seed,
      extrasText,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [eligible, extrasText, managers, respectForfeits, seed, seededRandom, winnersCount]);

  const exportMarkdown = useMemo(() => {
    const header = `# Prize Draw – ${CURRENT_SEASON}\n`;
    const meta = [
      `Seed: ${seed || '—'}`,
      `Respect forfeits: ${respectForfeits ? 'Yes' : 'No'}`,
      `Pool size: ${eligible.length}`,
      `Winners: ${winnersCount}`,
    ].join(' • ');

    const winList =
      drawn.length > 0
        ? drawn.map((m, i) => `${i + 1}. ${m.name}`).join('\n')
        : '_No draw yet_';

    const inel =
      respectForfeits && ineligible.length > 0
        ? `\n\n**Ineligible (${ineligible.length})**\n${ineligible
            .map((m) => `- ${m.name}`)
            .join('\n')}`
        : '';

    const extras =
      extrasText.trim().length > 0 ? `\n\n**Notes**\n${extrasText.trim()}` : '';

    return `${header}\n${meta}\n\n## Winners\n${winList}${inel}${extras}\n`;
  }, [CURRENT_SEASON, drawn, eligible.length, extrasText, ineligible, respectForfeits, seed, winnersCount]);

  const addLineAsManager = useCallback((line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    // Keep it dumb & forgiving: the whole line becomes the display name.
    return { name: trimmed } as Manager;
  }, []);

  const addExtras = useCallback(() => {
    if (!extrasText.trim()) return;
    const lines = extrasText.split('\n').map((l) => l.trim());
    const newOnes = lines.map(addLineAsManager).filter(Boolean) as Manager[];
    if (newOnes.length === 0) return;
    const names = new Set(managers.map((m) => m.name.toLowerCase()));
    const deduped = newOnes.filter((m) => !names.has(m.name.toLowerCase()));
    if (deduped.length === 0) return;

    const next = managers.concat(deduped);
    setManagers(next);
  }, [addLineAsManager, extrasText, managers]);

  const removeManager = useCallback(
    (name: string) => {
      setManagers((prev) => prev.filter((m) => m.name !== name));
    },
    [setManagers],
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Prize Draw</h1>
        <p className="text-sm text-gray-600">
          Season <span className="font-semibold">{CURRENT_SEASON}</span>. Hard-coded managers for now; automatic eligibility will kick in when forfeits are recorded.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 border rounded-xl p-4">
          <h2 className="text-xl font-semibold">Settings</h2>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={respectForfeits}
              onChange={(e) => setRespectForfeits(e.target.checked)}
            />
            <span className="text-sm">Respect forfeits (auto-exclude flagged managers)</span>
          </label>

          <div className="flex items-center gap-3">
            <label className="text-sm w-28">Winners</label>
            <input
              type="number"
              min={1}
              max={100}
              className="border rounded px-2 py-1 w-24"
              value={winnersCount}
              onChange={(e) => setWinnersCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm w-28">Seed (optional)</label>
            <input
              type="text"
              className="border rounded px-2 py-1 flex-1"
              placeholder="Use a seed for reproducible result"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={runDraw}
          >
            Run Draw
          </button>
        </div>

        <div className="space-y-3 border rounded-xl p-4">
          <h2 className="text-xl font-semibold">Add Extras (optional)</h2>
          <p className="text-sm text-gray-600">
            Paste one name per line. We’ll ignore exact duplicates.
          </p>
          <textarea
            className="w-full min-h-[120px] border rounded p-2"
            placeholder="e.g.\nAlex Example\nJamie Example"
            value={extrasText}
            onChange={(e) => setExtrasText(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              onClick={addExtras}
            >
              Add to Pool
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              onClick={() => setExtrasText('')}
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 border rounded-xl p-4">
          <h2 className="text-xl font-semibold">Eligible Pool ({eligible.length})</h2>
          <ul className="space-y-1 max-h-80 overflow-auto pr-2">
            {eligible.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-3">
                <span className="truncate">{m.name}</span>
                <button
                  className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200"
                  onClick={() => removeManager(m.name)}
                  title="Remove from this draw (does not affect future lists)"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border rounded-xl p-4">
          <h2 className="text-xl font-semibold">Ineligible (auto-excluded)</h2>
          {respectForfeits ? (
            ineligible.length ? (
              <ul className="space-y-1 max-h-80 overflow-auto pr-2">
                {ineligible.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-3">
                    <span className="truncate">{m.name}</span>
                    <span className="text-xs text-gray-500">forfeit</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No one is currently ineligible.</p>
            )
          ) : (
            <p className="text-sm text-gray-600">
              Forfeits ignored. Toggle “Respect forfeits” to auto-exclude.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3 border rounded-xl p-4">
        <h2 className="text-xl font-semibold">Winners</h2>
        {drawn.length === 0 ? (
          <p className="text-sm text-gray-600">Run the draw to see winners.</p>
        ) : (
          <ol className="list-decimal ml-6 space-y-1">
            {drawn.map((m) => (
              <li key={m.name}>{m.name}</li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={() => copy(exportMarkdown)}
            disabled={drawn.length === 0}
            title="Copy winners + context as Markdown"
          >
            Copy Markdown
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={() => {
              const data = {
                managers,
                respectForfeits,
                winnersCount,
                drawn,
                seed,
                extrasText,
                season: CURRENT_SEASON,
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `prizedraw-${CURRENT_SEASON}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={drawn.length === 0}
            title="Save JSON snapshot"
          >
            Download JSON
          </button>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-600">
            Preview export (Markdown)
          </summary>
          <pre className="mt-2 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
            {exportMarkdown}
          </pre>
        </details>
      </section>
    </main>
  );
}