'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { defaultSettings } from '@/lib/defaults';

type Fx = {
  id: string;
  round_label: string;
  scheduled_at: string | null;
  home_entrant_id: string | null;
  away_entrant_id: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

type Entrant = { id: string; manager: string; club: string; rating?: number };

export default function FixturesPublic() {
  const [season] = useState<string>(defaultSettings.season);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fx[]>([]);

  useEffect(() => {
    (async () => {
      const e = await fetch(`/api/entrants?season=${season}`).then(r => r.json());
      setEntrants(e.entrants || []);
      const f = await fetch(`/api/fixtures?season=${season}`).then(r => r.json());
      setFixtures(f.fixtures || []);
    })();
  }, [season]);

  const byRound = useMemo(() => {
    const m: Record<string, Fx[]> = {};
    for (const f of fixtures) (m[f.round_label] ||= []).push(f);
    return m;
  }, [fixtures]);

  const entrantsById = useMemo(
    () => Object.fromEntries(entrants.map(e => [e.id, e])),
    [entrants]
  );

  async function reportResult(fx: Fx) {
    const hs = prompt('Home score?'); if (hs == null) return;
    const as = prompt('Away score?'); if (as == null) return;
    await fetch(`/api/fixtures/${fx.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_score: Number(hs), away_score: Number(as) })
    });
    const f = await fetch(`/api/fixtures?season=${season}`).then(r => r.json());
    setFixtures(f.fixtures || []);
  }

  async function flagForfeit(fx: Fx, side: 'home'|'away') {
    await fetch(`/api/fixtures/${fx.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_score: 0, away_score: 0, flags: { forfeit: side } })
    });
    const f = await fetch(`/api/fixtures?season=${season}`).then(r => r.json());
    setFixtures(f.fixtures || []);
  }

  return (
    <div className="space-y-4">
      {Object.entries(byRound).map(([label, list]) => (
        <SectionCard key={label} title={label}>
          <ul className="space-y-2">
            {list.map(fx => {
              const H = fx.home_entrant_id ? entrantsById[fx.home_entrant_id] : undefined;
              const A = fx.away_entrant_id ? entrantsById[fx.away_entrant_id] : undefined;
              return (
                <li key={fx.id} className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
                  <span className="flex-1">
                    {H?.club ?? 'TBD'} vs {A?.club ?? 'TBD'}
                    {fx.scheduled_at ? ` — ${new Date(fx.scheduled_at).toLocaleString()}` : ''}
                  </span>
                  <span className="text-sm opacity-80">
                    {fx.status}{' '}
                    {fx.home_score != null && fx.away_score != null
                      ? `(${fx.home_score}-${fx.away_score})`
                      : ''}
                  </span>
                  <button className="btn" onClick={() => reportResult(fx)}>Report</button>
                  <button className="btn" onClick={() => flagForfeit(fx, 'home')}>Home FF</button>
                  <button className="btn" onClick={() => flagForfeit(fx, 'away')}>Away FF</button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}