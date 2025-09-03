'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { defaultSettings } from '@/lib/defaults';
import { useAdmin } from '@/components/AdminGate';

type Fx = {
  id: string;
  round_label: string;
  stage: 'groups' | 'youth_cup' | 'youth_shield';
  scheduled_at: string | null;
  home_entrant_id: string | null;
  away_entrant_id: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
};
type Entrant = { id: string; manager: string; club: string; rating?: number };

export default function FixturesPublic() {
  const { admin } = useAdmin();
  const [season, setSeason] = useState<string>(defaultSettings.season);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fx[]>([]);

  async function refresh() {
    const e = await fetch(`/api/entrants?season=${encodeURIComponent(season)}`).then((r) => r.json());
    setEntrants(e.entrants || []);
    const f = await fetch(`/api/fixtures?season=${encodeURIComponent(season)}`).then((r) => r.json());
    setFixtures(f.fixtures || []);
  }

  useEffect(() => { refresh(); }, [season]);

  const byRound = useMemo(() => {
    const m: Record<string, Fx[]> = {};
    for (const f of fixtures) (m[f.round_label] ||= []).push(f);
    return m;
  }, [fixtures]);

  const entrantsById = useMemo(
    () => Object.fromEntries(entrants.map((e) => [e.id, e])),
    [entrants]
  );

  async function reportResult(fx: Fx) {
    const hs = prompt('Home score?'); if (hs == null) return;
    const as = prompt('Away score?'); if (as == null) return;
    await fetch(`/api/fixtures/${fx.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_score: Number(hs), away_score: Number(as) }),
    });
    await refresh();
  }

  async function flagForfeit(fx: Fx, side: 'home' | 'away') {
    await fetch(`/api/fixtures/${fx.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_score: 0, away_score: 0, flags: { forfeit: side } }),
    });
    await refresh();
  }

  // Admin helper: mark confirmed if needed
  async function adminConfirm(fx: Fx) {
    if (!admin) return;
    await fetch(`/api/admin/fixtures/patch/${fx.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    await refresh();
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Fixtures — Season selector">
        <div className="flex gap-2 items-center">
          <input
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/20"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="e.g., S26"
          />
          <button className="btn" onClick={refresh}>Load</button>
        </div>
      </SectionCard>

      {Object.entries(byRound).map(([label, list]) => (
        <SectionCard key={label} title={label}>
          <ul className="space-y-2">
            {list.map((fx) => {
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
                  {admin && (
                    <button className="btn border-emerald-400 hover:bg-emerald-400/20" onClick={() => adminConfirm(fx)}>
                      Admin: confirm
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}