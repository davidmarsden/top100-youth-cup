'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { useAdmin } from '@/components/AdminGate';
import { useSeason } from '@/components/SeasonProvider';
import { isSupabase } from '@/lib/mode';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';  // prevent SSG for this page
export const revalidate = false;         // must be a number or false (NOT an object)
export const fetchCache = 'force-no-store';

type Fx = {
  id: string;
  season_id?: string;
  stage?: 'groups' | 'youth_cup' | 'youth_shield' | string;
  round?: number;
  round_label?: string;
  leg?: 'single' | 'first' | 'second' | string;
  group_code?: string | null;
  home_entrant_id?: string | null;
  away_entrant_id?: string | null;
  homeId?: string | null;
  awayId?: string | null;
  scheduled_at?: string | null;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
};

type Entrant = {
  id: string;
  manager: string;
  club: string;
  rating?: number;
};

export default function FixturesPublic() {
  const { admin } = useAdmin();
  const SEASON_DEFAULT = useSeason();
  const search = useSearchParams();

  const seasonFromUrl = search.get('season') || undefined;
  const initialSeason = seasonFromUrl ?? SEASON_DEFAULT;
  const [season] = useState<string>(() => initialSeason);

  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (isSupabase) {
          const [eRes, fRes] = await Promise.all([
            fetch(`/api/entrants?season=${encodeURIComponent(season)}`, { cache: 'no-store' }),
            fetch(`/api/fixtures?season=${encodeURIComponent(season)}`, { cache: 'no-store' }),
          ]);
          if (!eRes.ok) throw new Error(`Entrants ${eRes.status}`);
          if (!fRes.ok) throw new Error(`Fixtures ${fRes.status}`);

          const eJson = await eRes.json();
          const fJson = await fRes.json();
          if (cancelled) return;

          setEntrants(Array.isArray(eJson.entrants) ? eJson.entrants : []);
          setFixtures(Array.isArray(fJson.fixtures) ? fJson.fixtures : []);
        } else {
          const eLocal = typeof window !== 'undefined' ? window.localStorage.getItem('yc:entrants') : null;
          const fLocal = typeof window !== 'undefined' ? window.localStorage.getItem('yc:fixtures') : null;
          if (cancelled) return;
          setEntrants(eLocal ? JSON.parse(eLocal) : []);
          setFixtures(fLocal ? JSON.parse(fLocal) : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load fixtures');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [season]);

  const entrantsById = useMemo(() => {
    const m = new Map<string, Entrant>();
    for (const e of entrants) m.set(e.id, e);
    return m;
  }, [entrants]);

  const byRound = useMemo(() => {
    const map = new Map<string, Fx[]>();
    for (const f of fixtures) {
      const label = f.round_label || (f.round != null ? `Round ${f.round}` : 'Unlabeled');
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(f);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [fixtures]);

  return (
    <div className="space-y-4">
      <SectionCard title={`Fixtures — ${season}`}>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-400">Error: {error}</p>}
        {!loading && !error && !fixtures.length && <p>No fixtures yet.</p>}

        {!loading && !error && fixtures.length > 0 && (
          <div className="space-y-4">
            {byRound.map(([label, list]) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <h3 className="font-semibold mb-2">{label}</h3>
                <ul className="space-y-1">
                  {list.map((f) => {
                    const h = entrantsById.get(f.homeId || f.home_entrant_id || '');
                    const a = entrantsById.get(f.awayId || f.away_entrant_id || '');
                    const when = f.scheduled_at ? new Date(f.scheduled_at).toLocaleString() : 'Unscheduled';
                    const score =
                      f.home_score != null && f.away_score != null
                        ? ` — ${f.home_score}-${f.away_score}${f.status ? ` (${f.status})` : ''}`
                        : '';
                    return (
                      <li key={f.id}>
                        {h?.club ?? 'TBD'} vs {a?.club ?? 'TBD'} @ {when}{score}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {!isSupabase && (
        <p className="text-xs opacity-70">
          Using local storage fallback. Configure Supabase to share fixtures with everyone.
        </p>
      )}
    </div>
  );
}