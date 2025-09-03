'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';

type Entrant = { id: string; manager: string; club: string; rating?: number };
type Fx = {
  id: string;
  round_label: string;
  stage: 'groups' | 'youth_cup' | 'youth_shield';
  scheduled_at: string | null;
  home_entrant_id: string | null;
  away_entrant_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

export default function SeasonArchive({ params }: { params: { code: string } }) {
  const season = params.code;
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fx[]>([]);

  useEffect(() => {
    (async () => {
      const e = await fetch(`/api/entrants?season=${encodeURIComponent(season)}`).then((r) => r.json());
      setEntrants(e.entrants || []);
      const f = await fetch(`/api/fixtures?season=${encodeURIComponent(season)}`).then((r) => r.json());
      setFixtures(f.fixtures || []);
    })();
  }, [season]);

  const entrantsById = useMemo(
    () => Object.fromEntries(entrants.map((e) => [e.id, e])),
    [entrants]
  );

  // Minimal table from confirmed group results
  type Row = { entrantId: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
  const table = useMemo(() => {
    const t: Record<string, Row> = {};
    const groupGames = fixtures.filter((f) => f.stage === 'groups' && f.status === 'confirmed');
    for (const fx of groupGames) {
      const H = fx.home_entrant_id!, A = fx.away_entrant_id!;
      const hs = fx.home_score ?? 0, as = fx.away_score ?? 0;
      t[H] ??= { entrantId: H, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      t[A] ??= { entrantId: A, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      t[H].played++; t[A].played++;
      t[H].gf += hs; t[H].ga += as; t[A].gf += as; t[A].ga += hs;
      if (hs > as) { t[H].won++; t[A].lost++; t[H].points += 3; }
      else if (hs < as) { t[A].won++; t[H].lost++; t[A].points += 3; }
      else { t[H].drawn++; t[A].drawn++; t[H].points++; t[A].points++; }
    }
    return Object.values(t).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  }, [fixtures]);

  const byRound = useMemo(() => {
    const m: Record<string, Fx[]> = {};
    fixtures.forEach((f) => (m[f.round_label] ||= []).push(f));
    return m;
  }, [fixtures]);

  return (
    <div className="space-y-6">
      <SectionCard title={`Season ${season}: Entrants (${entrants.length})`}>
        <ul className="grid md:grid-cols-2 gap-2">
          {entrants.map((e) => (
            <li key={e.id}>
              {e.manager} — {e.club} {e.rating ? `(${e.rating})` : ''}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Group Tables (confirmed results)">
        {!table.length ? (
          <p>No confirmed group results yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Club</th><th className="text-right">P</th><th className="text-right">Pts</th><th className="text-right">GD</th></tr>
            </thead>
            <tbody>
              {table.map((r) => {
                const e = entrantsById[r.entrantId];
                return (
                  <tr key={r.entrantId} className="border-top border-white/10">
                    <td className="py-1 pr-2">{e?.club ?? r.entrantId}</td>
                    <td className="py-1 text-right">{r.played}</td>
                    <td className="py-1 text-right">{r.points}</td>
                    <td className="py-1 text-right">{r.gf - r.ga}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard title="Fixtures & Results">
        {Object.entries(byRound).map(([label, list]) => (
          <div key={label} className="mb-4">
            <h3 className="font-semibold mb-2">{label}</h3>
            <ul className="space-y-1">
              {list.map((f) => {
                const H = f.home_entrant_id ? entrantsById[f.home_entrant_id] : undefined;
                const A = f.away_entrant_id ? entrantsById[f.away_entrant_id] : undefined;
                return (
                  <li key={f.id}>
                    {H?.club ?? 'TBD'} {f.home_score != null ? f.home_score : ''} — {f.away_score != null ? f.away_score : ''} {A?.club ?? 'TBD'}
                    {f.scheduled_at ? `  (${new Date(f.scheduled_at).toLocaleDateString()})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}