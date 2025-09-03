'use client';
import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { Fixture } from '@/lib/types';
import { load } from '@/lib/utils';
import { saturdaysBetween, allocateRoundDates, LegSpec } from '@/lib/schedule';

/** Derive a human-readable label per fixture to match plan labels */
function labelOf(f: Fixture): string {
  if (f.stage === 'groups') return `Group R${f.round}`;
  // For KO/Shield, set f.koLabel when creating fixtures (e.g., 'Cup R32', 'Shield R1', 'Cup QF (Leg 1)')
  return f.koLabel || 'KO';
}

export default function SchedulePage() {
  // Load fixtures (from localStorage for MVP; swap to Supabase fetch later)
  const [fixtures, setFixtures] = useState<Fixture[]>(() => load('yc:fixtures', []));

  // Available Saturdays in window (Europe/London season dates)
  const dates = useMemo(
    () => saturdaysBetween('2025-09-20', '2026-01-10'),
    []
  );

  // Compute how many group rounds exist from fixtures
  const groupRounds = useMemo(() => {
    const groupFix = fixtures.filter(f => f.stage === 'groups');
    return groupFix.length ? Math.max(...groupFix.map(f => f.round)) : 0;
  }, [fixtures]);

  // Build the round plan dynamically
  const plan: LegSpec[] = useMemo(() => {
    const p: LegSpec[] = [];
    for (let r = 1; r <= groupRounds; r++) p.push({ label: `Group R${r}`, legs: 1 });
    p.push({ label: 'Cup R32', legs: 1 });
    p.push({ label: 'Shield R1', legs: 1 });
    p.push({ label: 'Cup R16', legs: 2 }, { label: 'Shield R16', legs: 2 });
    p.push({ label: 'Cup QF', legs: 2 }, { label: 'Shield QF', legs: 2 });
    p.push({ label: 'Cup SF', legs: 2 }, { label: 'Shield SF', legs: 2 });
    p.push({ label: 'Cup Final', legs: 2 }, { label: 'Shield Final', legs: 2 });
    return p;
  }, [groupRounds]);

  // Allocate dates across the plan
  const allocations = useMemo(() => allocateRoundDates(dates, plan), [dates, plan]);

  /** Apply allocated date(s) to all fixtures in a round
   *  legIdx: 0 for single/first leg, 1 for second leg
   */
  async function applyToFixtures(roundLabel: string, legIdx: 0 | 1 = 0) {
    const slot = allocations[roundLabel];
    if (!slot || !slot[legIdx]) return alert('No date allocated for this round/leg.');
    const selectedISO = slot[legIdx];

    // Select fixtures that belong to this round label.
    // For two-leg KOs, you may encode leg info in koLabel (e.g., 'Cup QF (Leg 1)').
    const target = fixtures.filter(f => {
      const lbl = labelOf(f);
      if (slot.length === 2) {
        // try to match leg explicitly if your koLabel includes it
        if (f.koLabel?.includes('Leg 1') && legIdx === 0) return f.koLabel!.startsWith(roundLabel);
        if (f.koLabel?.includes('Leg 2') && legIdx === 1) return f.koLabel!.startsWith(roundLabel);
      }
      return lbl === roundLabel; // groups & single-leg rounds
    });

    if (target.length === 0) return alert(`No fixtures found for ${roundLabel}${slot.length === 2 ? ` (Leg ${legIdx+1})` : ''}.`);

    // Optimistic local update (so you see it immediately)
    const updated = fixtures.map(f =>
      target.some(t => t.id === f.id) ? { ...f, scheduled_at: selectedISO as any } : f
    );
    setFixtures(updated);

    // Persist via API + backup to Sheets
    for (const fixture of target) {
      try {
        await fetch(`/api/fixtures/${fixture.id}/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_at: selectedISO }),
        });
        await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'fixtures',
            rows: [[fixture.id, selectedISO, roundLabel]],
          }),
        });
      } catch (e) {
        console.error('Schedule/backup failed for fixture', fixture.id, e);
      }
    }

    alert(`Applied ${selectedISO} to ${target.length} fixtures in ${roundLabel}${slot.length === 2 ? ` (Leg ${legIdx+1})` : ''}.`);
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
            <div key={label} className="bg-white/10 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{label}</div>
                <div className="text-sm opacity-90">
                  {dts.map((d, i) => <span key={i} className="ml-2">{i ? '• ' : ''}{d}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                {/* Buttons become "Leg 1 / Leg 2" if two dates are allocated */}
                <button className="btn" onClick={() => applyToFixtures(label, 0)}>
                  Apply {dts.length === 2 ? 'Leg 1' : 'Date'}
                </button>
                {dts.length === 2 && (
                  <button className="btn" onClick={() => applyToFixtures(label, 1)}>
                    Apply Leg 2
                  </button>
                )}
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