'use client';
import React, { useMemo, useState, useEffect } from 'react';
import SectionCard from '@/components/SectionCard';
import { Fixture } from '@/lib/types';
import { load } from '@/lib/utils';
import { saturdaysBetween, allocateRoundDates, LegSpec } from '@/lib/schedule';

/** Helper: generate a human label for a fixture’s round */
function labelOf(f: Fixture): string {
  // Groups: derive from round number
  if (f.stage === 'groups') return `Group R${f.round}`;
  // Knockouts: prefer koLabel if you set it when creating KO fixtures
  if (f.koLabel) return f.koLabel;
  // Fallback (you can refine this if you store round_label later)
  return 'KO';
}

export default function SchedulePage() {
  /** Load fixtures (localStorage for now; will come from Supabase later) */
  const [fixtures, setFixtures] = useState<Fixture[]>(() => load<Fixture[]>('yc:fixtures', []));

  useEffect(() => {
    // If you later fetch from Supabase, do it here and setFixtures(...)
  }, []);

  /** Available Saturdays in window */
  const dates = useMemo(
    () => saturdaysBetween('2025-09-20', '2026-01-10'),
    []
  );

  /** ▶️ Your first block goes here: compute groupRounds from fixtures */
  const groupRounds = useMemo(() => {
    const groupFix = fixtures.filter(f => f.stage === 'groups');
    return groupFix.length ? Math.max(...groupFix.map(f => f.round)) : 0;
  }, [fixtures]);

  /** ▶️ Your second block: build the plan dynamically using groupRounds */
  const plan: LegSpec[] = useMemo(() => {
    const p: { label: string; legs: 1 | 2 }[] = [];
    for (let r = 1; r <= groupRounds; r++) p.push({ label: `Group R${r}`, legs: 1 });
    p.push({ label: 'Cup R32', legs: 1 });
    p.push({ label: 'Shield R1', legs: 1 });
    p.push({ label: 'Cup R16', legs: 2 }, { label: 'Shield R16', legs: 2 });
    p.push({ label: 'Cup QF', legs: 2 }, { label: 'Shield QF', legs: 2 });
    p.push({ label: 'Cup SF', legs: 2 }, { label: 'Shield SF', legs: 2 });
    p.push({ label: 'Cup Final', legs: 2 }, { label: 'Shield Final', legs: 2 });
    return p;
  }, [groupRounds]);

  /** Allocate plan → dates */
  const allocations = useMemo(() => allocateRoundDates(dates, plan), [dates, plan]);

  /** ▶️ Your third block: apply allocations to real fixtures */
  async function applyToFixtures(roundLabel: string) {
    // If two legs, allocations[roundLabel] will have [leg1ISO, leg2ISO]; this example applies leg1.
    const dateISO = allocations[roundLabel]?.[0]; // or handle [0]/[1] per leg in your UI
    if (!dateISO) return alert('No date allocated for this round.');

    // Match fixtures by derived label (Groups) or koLabel (KO/Shield)
    const target = fixtures.filter(f => labelOf(f) === roundLabel);

    // Local-only update for now (persist to Supabase via API when wired)
    const updated = fixtures.map(f =>
      labelOf(f) === roundLabel ? { ...f, scheduled_at: dateISO as any } : f
    );
    setFixtures(updated);

    // TODO (when Supabase is connected): POST to /api/fixtures/[id]/schedule for each target fixture
    // for (const fx of target) {
    //   await fetch(`/api/fixtures/${fx.id}/schedule`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ scheduled_at: dateISO })
    //   });
    // }

    alert(`Applied ${dateISO} to ${target.length} fixtures in ${roundLabel}.`);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <SectionCard title="Available Saturdays">
        <ol className="list-decimal list-inside space-y-1 max-h-[320px] overflow-auto">
          {dates.map(d => <li key={d}>{d}</li>)}
        </ol>
      </SectionCard>

      <SectionCard title="Round → Allocated Date(s)">
        <div className="space-y-3">
          {Object.entries(allocations).map(([label, dts]) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{label}</div>
                <div className="text-sm opacity-90">{dts.join('  •  ')}</div>
              </div>
              <div className="mt-2">
                {/* ▶️ Your fourth block: the Apply buttons */}
                <button className="btn" onClick={() => applyToFixtures(label)}>
                  Apply dates to {label}
                </button>
              </div>
            </div>
          ))}
          {!Object.keys(allocations).length && <p>No allocations — add rounds to the plan.</p>}
        </div>
      </SectionCard>

      <SectionCard title="Preview: Fixtures count by round">
        <ul className="space-y-1">
          {Object.keys(allocations).map(label => {
            const count = fixtures.filter(f => labelOf(f) === label).length;
            return <li key={label}>{label}: {count} fixtures</li>;
          })}
        </ul>
      </SectionCard>
    </div>
  );
}