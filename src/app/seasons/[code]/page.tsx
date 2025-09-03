'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';

type Entrant = { id: string; manager: string; club: string; rating?: number };
type Fx = {
  id: string; round_label: string; stage: 'groups'|'youth_cup'|'youth_shield';
  scheduled_at: string | null; home_entrant_id: string | null; away_entrant_id: string | null;
  home_score: number | null; away_score: number | null; status: string;
};

export default function SeasonArchive({ params }: { params: { code: string } }) {
  const season = params.code;
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

  const entrantsById = useMemo(() => Object.fromEntries(entrants.map(e => [e.id, e])), [entrants]);

  // Simple standings from confirmed fixtures only (groups)
  type Row = { entrantId:string; played:number; won:number; drawn:number; lost:number; gf:number; ga:number; points:number; group?:string };
  const tables = useMemo(()=>{
    const table: Record<string, Row> = {};
    const groups: Record<string, string[]> = {};
    for (const fx of fixtures.filter(f=>f.stage==='groups' && f.status==='confirmed')) {
      const H = fx.home_entrant_id!, A = fx.away_entrant_id!;
      const hs = fx.home_score ?? 0, as = fx.away_score ?? 0;
      table[H] ??= { entrantId:H, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, points:0 };
      table[A] ??= { entrantId:A, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, points:0 };
      table[H].played++; table[A].played++;
      table[H].gf+=hs; table[H].ga+=as; table[A].gf+=as; table[A].ga+=hs;
      if (hs>as){ table[H].won++; table[A].lost++; table[H].points+=3; }
      else if (hs<as){ table[A].won++; table[H].lost++; table[A].points+=3; }
      else { table[H].drawn++; table[A].drawn++; table[H].points++; table[A].points++; }
      // infer group label from round_label like "Group R3"
      const g = /Group R\d+/.test(fx.round_label) ? 'A' : 'A'; // optional: store actual group code if you persist it
    }
    return Object.values(table).sort((a,b)=> b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf);
  }, [fixtures]);

  const byRound = useMemo(()=>{
    const m: Record<string, Fx[]> = {};
    fixtures.forEach(f => (m[f.round_label] ||= []).push(f));
    return m;
  }, [fixtures]);

  return (
    <div className="space-y-6">
      <SectionCard title={`Season ${season}: Entrants (${entrants.length})`}>
        <ul className="grid md:grid-cols-2 gap-2">
          {entrants.map(e => <li key={e.id}>{e.manager} — {e.club} {e.rating ? `(${e.rating})` : ''}</li>)}
        </ul>
      </SectionCard>

      <SectionCard title="Group Tables (confirmed results)">
        {!tables.length ? <p>No confirmed group results yet.</p> : (
          <table className="table">
            <thead><tr><th>Club</th><th className="text-right">P</th><th className="text-right">Pts</th><th className="text-right">GD</th></tr></thead>
            <tbody>
              {tables.map(r=>{
                const e = entrantsById[r.entrantId];
                return (
                  <tr key={r.entrantId} className="border-t border-white/10">
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
        {Object.entries(byRound).map(([label, list])=>(
          <div key={label} className="mb-4">
            <h3 className="font-semibold mb-2">{label}</h3>
            <ul className="space-y-1">
              {list.map(f=>{
                const H = f.home_entrant_id ? entrantsById[f.home_entrant_id] : undefined;
                const A = f.away_entrant_id ? entrantsById[f.away_entrant_id] : undefined;
                return (
                  <li key={f.id}>
                    {H?.club ?? 'TBD'} {f.home_score!=null ? f.home_score : ''} — {f.away_score!=null ? f.away_score : ''} {A?.club ?? 'TBD'}
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