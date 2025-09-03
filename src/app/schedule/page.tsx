'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { useSeason } from '@/components/SeasonProvider';
import { isSupabase } from '@/lib/mode';

type Fx = {
  id: string;
  round_label?: string;
  scheduled_at?: string | null;
  home_entrant_id?: string | null;
  away_entrant_id?: string | null;
  stage?: string;
};

export default function SchedulePage() {
  const SEASON = useSeason();
  const [fixtures, setFixtures] = useState<Fx[]>([]);

  useEffect(() => {
    (async () => {
      if (isSupabase) {
        const r = await fetch(`/api/fixtures?season=${encodeURIComponent(SEASON)}`);
        const j = await r.json();
        setFixtures(j.fixtures || []);
      } else {
        // local fallback
        const s = localStorage.getItem('yc:fixtures');
        setFixtures(s ? JSON.parse(s) : []);
      }
    })();
  }, [SEASON]);

  const byRound = useMemo(() => {
    const map: Record<string, Fx[]> = {};
    for (const f of fixtures) {
      const label = f.round_label || 'Unlabelled';
      if (!map[label]) map[label] = [];
      map[label].push(f);
    }
    return map;
  }, [fixtures]);

  return (
    <div className="space-y-4">
      <SectionCard title={`Schedule — ${SEASON}`}>
        {!fixtures.length ? (
          <p>No fixtures yet.</p>
        ) : (
          Object.keys(byRound).map(label => (
            <div key={label} className="mb-4">
              <h3 className="font-semibold mb-2">{label}</h3>
              <ul className="space-y-1">
                {byRound[label].map(f => (
                  <li key={f.id}>
                    {f.scheduled_at ? new Date(f.scheduled_at).toLocaleString() : 'Unscheduled'}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}