'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SectionCard from '@/components/SectionCard';
import { useAdmin } from '@/components/AdminGate';
import { Fixture, Entrant } from '@/lib/types';

// Avoid static prerender/ISR and caching
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';

type Fx = Fixture;

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function FixturesPage() {
  const { admin } = useAdmin();
  const sp = useSearchParams();

  const [season, setSeason] = useState<string>(sp.get('season') ?? '');
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const qs = season ? `?season=${encodeURIComponent(season)}` : '';
        const [eRes, fRes] = await Promise.all([
          fetch(`/api/entrants${qs}`, { cache: 'no-store' }),
          fetch(`/api/fixtures${qs}`, { cache: 'no-store' }),
        ]);
        const eJson = await eRes.json();
        const fJson = await fRes.json();
        if (!alive) return;
        setEntrants(eJson?.items ?? []);
        setFixtures(fJson?.items ?? []);
      } catch {
        if (alive) {
          setEntrants([]);
          setFixtures([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [season]);

  const byRound = useMemo(() => {
    const map: Record<string, Fx[]> = {};
    for (const fx of fixtures) {
      const st = fx.stage ?? ''; // stage may be undefined/null

      const baseStage =
        st === 'groups' ? 'Groups' : st ? st.replace(/_/g, ' ') : 'Unknown';

      const baseRound =
        st === 'groups'
          ? (fx.round ? `R${fx.round}` : '')
          : (fx.round_label ?? (fx.round ? `R${fx.round}` : ''));

      const key = [baseStage, baseRound].filter(Boolean).join(' ').trim();

      if (!map[key]) map[key] = [];
      map[key].push(fx);
    }
    for (const k of Object.keys(map)) {
      map[k].sort(
        (a, b) =>
          (a.scheduled_at || '').localeCompare(b.scheduled_at || '') ||
          a.id.localeCompare(b.id)
      );
    }
    return map;
  }, [fixtures]);

  // Accept string | null | undefined to satisfy TS where Supabase may return null
  const managerOf = (id: string | null | undefined) => {
    if (!id) return 'TBC';
    return entrants.find((e) => e.id === id)?.manager ?? 'TBC';
  };
  const clubOf = (id: string | null | undefined) => {
    if (!id) return 'TBC';
    return entrants.find((e) => e.id === id)?.club ?? 'TBC';
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <SectionCard title="Filters">
        <div className="space-y-2">
          <label className="block text-sm opacity-80">Season code</label>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="e.g., S26"
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
          />
          <p className="text-xs opacity-70">Leave blank to use the server’s current season.</p>
          <p className="text-xs opacity-70">
            Mode: <span className="font-semibold">{admin ? 'Admin' : 'Viewer'}</span>
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Fixtures">
        {loading && <p className="opacity-70">Loading…</p>}
        {!loading && fixtures.length === 0 && <p className="opacity-70">No fixtures found.</p>}

        {!loading && fixtures.length > 0 && (
          <div className="space-y-6">
            {Object.entries(byRound).map(([roundLabel, rows]) => (
              <div key={roundLabel}>
                <h3 className="font-semibold mb-2">{roundLabel}</h3>
                <table className="table w-full">
                  <thead>
                    <tr className="text-left opacity-80">
                      <th className="py-1">Kick-off</th>
                      <th className="py-1">Home</th>
                      <th className="py-1"></th>
                      <th className="py-1">Away</th>
                      <th className="py-1 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((fx) => (
                      <tr key={fx.id} className="border-t border-white/10">
                        <td className="py-1 pr-2">{fmt(fx.scheduled_at ?? null)}</td>
                        <td className="py-1 pr-2">
                          <div className="text-sm font-medium">{clubOf(fx.home_id)}</div>
                          <div className="text-xs opacity-70">{managerOf(fx.home_id)}</div>
                        </td>
                        <td className="py-1 pr-2 text-center">vs</td>
                        <td className="py-1 pr-2">
                          <div className="text-sm font-medium">{clubOf(fx.away_id)}</div>
                          <div className="text-xs opacity-70">{managerOf(fx.away_id)}</div>
                        </td>
                        <td className="py-1 text-right">
                          {fx.home_goals ?? '–'} : {fx.away_goals ?? '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Notes">
        <ul className="list-disc pl-5 text-sm space-y-2 opacity-80">
          <li>This page is <strong>force-dynamic</strong> and <strong>no-store</strong> to avoid prerendering.</li>
          <li>IDs from Supabase can be <code>null</code>; helpers now guard for that.</li>
        </ul>
      </SectionCard>
    </div>
  );
}