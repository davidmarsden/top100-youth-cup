'use client';
import React, { useMemo } from 'react';
import SectionCard from '@/components/SectionCard';
import { saturdaysBetween, allocateRoundDates, LegSpec } from '@/lib/schedule';

export default function SchedulePage(){
  // 👉 Your block goes here (in code, not comments):
  const dates = useMemo(() => saturdaysBetween('2025-09-20','2026-01-10'), []);
  const plan: LegSpec[] = useMemo(() => ([
    { label: 'Group R1', legs: 1 },
    { label: 'Group R2', legs: 1 },
    { label: 'Group R3', legs: 1 },
    // add more group rounds here if needed…
    { label: 'Cup R32', legs: 1 },
    { label: 'Shield R1', legs: 1 },
    { label: 'Cup R16', legs: 2 },
    { label: 'Shield R16', legs: 2 },
    { label: 'Cup QF', legs: 2 },
    { label: 'Shield QF', legs: 2 },
    { label: 'Cup SF', legs: 2 },
    { label: 'Shield SF', legs: 2 },
    { label: 'Cup Final', legs: 2 },
    { label: 'Shield Final', legs: 2 },
  ]), []);

  const allocations = useMemo(() => allocateRoundDates(dates, plan), [dates, plan]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title="Available Saturdays">
        <ol className="list-decimal list-inside space-y-1 max-h-[320px] overflow-auto">
          {dates.map(d => <li key={d}>{d}</li>)}
        </ol>
      </SectionCard>

      <SectionCard title="Round → Allocated Date(s)">
        <div className="space-y-3">
          {Object.entries(allocations).map(([label, dts]) => (
            <div key={label} className="flex items-center justify-between bg-white/10 rounded-xl p-2">
              <div className="font-semibold">{label}</div>
              <div className="text-sm opacity-90">{dts.join('  •  ')}</div>
            </div>
          ))}
          {!Object.keys(allocations).length && <p>No allocations — add rounds to the plan.</p>}
        </div>
      </SectionCard>
    </div>
  );
}