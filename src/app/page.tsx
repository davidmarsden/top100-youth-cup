'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';

// Components
import SectionCard from '@/components/SectionCard';
import Tabs from '@/components/Tabs';
import EntrantsTable from '@/components/Entrants';
import { useAdmin } from '@/components/AdminGate';
import { useSeason } from '@/components/SeasonProvider';

// Lib
import { defaultSettings } from '@/lib/defaults';
import { Entrant, Fixture, GroupTeam, Settings, Standing } from '@/lib/types';
import { load, save } from '@/lib/utils';
import {
  assignGroups,
  generateGroupFixtures,
  computeStandings,
  rankWithinGroups,
  computeKO32,
} from '@/lib/draw';
import { isSupabase } from '@/lib/mode';

function uid() {
  return (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2);
}

/** Helpers to be resilient to small type-name differences */
function winsOf(s: any) { return s.won ?? s.w ?? 0; }
function drawsOf(s: any) { return s.drawn ?? s.d ?? 0; }
function lossesOf(s: any) { return s.lost ?? s.l ?? 0; }
function playedOf(s: any) {
  if (s.played != null) return s.played;
  const w = winsOf(s), d = drawsOf(s), l = lossesOf(s);
  return w + d + l;
}
function gfOf(s: any) { return s.gf ?? s.goalsFor ?? 0; }
function gaOf(s: any) { return s.ga ?? s.goalsAgainst ?? 0; }
function pointsOf(s: any) {
  if (s.points != null) return s.points;
  if (s.pts != null) return s.pts;
  return winsOf(s) * 3 + drawsOf(s);
}

export default function AppPage() {
  const { admin } = useAdmin();
  const SEASON = useSeason();

  // SETTINGS
  const [settings, setSettings] = useState<Settings>(() =>
    load<Settings>('yc:settings', defaultSettings)
  );
  useEffect(() => save('yc:settings', settings), [settings]);

  // ENTRANTS
  const [entrants, setEntrants] = useState<Entrant[]>(
    () => (isSupabase ? [] : load<Entrant[]>('yc:entrants', []))
  );
  useEffect(() => {
    if (!isSupabase) save('yc:entrants', entrants);
  }, [entrants]);

  // GROUPS + FIXTURES
  const [groups, setGroups] = useState<GroupTeam[]>(() => load<GroupTeam[]>('yc:groups', []));
  useEffect(() => save('yc:groups', groups), [groups]);

  const [fixtures, setFixtures] = useState<Fixture[]>(() => load<Fixture[]>('yc:fixtures', []));
  useEffect(() => save('yc:fixtures', fixtures), [fixtures]);

  // ADMIN NOTES
  const [adminNotes, setAdminNotes] = useState<string>(() => load<string>('yc:adminNotes', ''));
  useEffect(() => save('yc:adminNotes', adminNotes), [adminNotes]);

  // TABS
  const [tab, setTab] = useState<string>('Entrants');

  // ---------- SUPABASE INTEGRATION ----------
  useEffect(() => {
    if (!isSupabase) return;
    (async () => {
      // ensure season row (by code)
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: SEASON,
          age_cutoff: settings.ageCutoffISO,
          timezone: settings.timezone,
        }),
      });
      // entrants
      const res = await fetch(`/api/entrants?season=${encodeURIComponent(SEASON)}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
      // fixtures
      const fxRes = await fetch(`/api/fixtures?season=${encodeURIComponent(SEASON)}`);
      const fxJson = await fxRes.json();
      if (Array.isArray(fxJson.fixtures)) setFixtures(fxJson.fixtures);
    })();
  }, [SEASON, settings.ageCutoffISO, settings.timezone]);

  // ---------- COMPUTATIONS ----------
  const standings: Standing[] = useMemo(
    () => computeStandings(fixtures, settings, entrants, groups),
    [fixtures, settings, entrants, groups]
  );

  const groupedStandings = useMemo(() => rankWithinGroups(standings) as unknown, [standings]);

  const ko = useMemo(() => computeKO32(standings, groups, settings) as unknown, [standings, groups, settings]);

  // ---------- ACTIONS (Admin) ----------
  const addEntrant = async () => {
    const manager = prompt('Manager name?');
    if (!manager) return;
    const club = prompt('Club?');
    if (!club) return;
    const ratingRaw = prompt('Average rating (optional)?') || '';
    const rating = ratingRaw.trim() === '' ? undefined : Number(ratingRaw);

    if (isSupabase) {
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: SEASON, age_cutoff: settings.ageCutoffISO, timezone: settings.timezone }),
      });
      await fetch('/api/entrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season: SEASON,
          manager: manager.trim(),
          club: club.trim(),
          rating: isNaN(Number(rating)) ? undefined : rating,
        }),
      });
      const res = await fetch(`/api/entrants?season=${SEASON}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      setEntrants((e) => [...e, { id: uid(), manager: manager.trim(), club: club.trim(), rating: isNaN(Number(rating)) ? undefined : rating }]);
    }
  };

  const clearEntrants = async () => {
    if (!confirm(`Clear all entrants for ${SEASON}?`)) return;
    if (isSupabase) {
      await fetch('/api/admin/entrants/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: SEASON }),
      });
      const res = await fetch(`/api/entrants?season=${SEASON}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      setEntrants([]);
      if (typeof window !== 'undefined') window.localStorage.removeItem('yc:entrants');
    }
    alert(`Entrants cleared for ${SEASON}.`);
  };

  const doDraw = async () => {
    if (entrants.length < 4) {
      alert('Need at least 4 entrants to draw groups.');
      return;
    }
    const g = assignGroups(entrants, settings);
    setGroups(g);
    const fx = generateGroupFixtures(g, !!settings.doubleRoundRobin);
    setFixtures(fx);

    // Persist fixtures in Supabase via server proxy (admin-only)
    if (isSupabase && admin) {
      const payload = fx.map((f: any) => ({
        id: f.id,
        stage: 'groups',
        round_label: `Group R${f.round}`,
        leg: 'single',
        homeId: f.homeId ?? f.home_entrant_id ?? null,
        awayId: f.awayId ?? f.away_entrant_id ?? null,
        status: 'pending',
      }));
      await fetch('/api/admin/fixtures/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: SEASON, fixtures: payload }),
      });
      const fresh = await fetch(`/api/fixtures?season=${SEASON}`).then((r) => r.json());
      if (fresh.fixtures) setFixtures(fresh.fixtures);
    }

    setTab('Groups');
  };

  const switchSeason = async () => {
    alert('Season switching is now driven by Supabase “current season”. Use the Seasons admin to change it.');
  };

  // ---------- RENDER HELPERS ----------
  const renderGroups = () => {
    if (!groups.length) return <p>No groups yet. Draw to generate groups.</p>;
    const byGroup: { [key: string]: GroupTeam[] } = {};
    for (const gt of groups) {
      if (!byGroup[gt.group]) byGroup[gt.group] = [];
      byGroup[gt.group].push(gt);
    }
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.keys(byGroup).sort().map((g) => (
          <SectionCard key={g} title={`Group ${g} — ${SEASON}`}>
            <ul className="space-y-1">
              {byGroup[g].map((m) => {
                const e = entrants.find((x) => x.id === m.entrantId);
                return (
                  <li key={m.entrantId}>
                    {e?.manager} — {e?.club} {e?.rating ? `(${e.rating})` : ''}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        ))}
      </div>
    );
  };

  const renderFixtures = () => {
    if (!fixtures.length) return <p>No fixtures yet. Draw to generate fixtures.</p>;
    const byRound: { [key: string]: Fixture[] } = {};
    for (const fx of fixtures as any[]) {
      const label = (fx as any).round_label || `Group R${(fx as any).round}`;
      if (!byRound[label]) byRound[label] = [];
      byRound[label].push(fx as Fixture);
    }
    return (
      <div className="space-y-4">
        {Object.keys(byRound).map((label) => (
          <SectionCard key={label} title={`${label} — ${SEASON}`}>
            <ul className="space-y-1">
              {byRound[label].map((f: any) => {
                const h = entrants.find((e) => e.id === f.homeId || e.id === f.home_entrant_id);
                const a = entrants.find((e) => e.id === f.awayId || e.id === f.away_entrant_id);
                return (
                  <li key={f.id}>
                    {h?.club ?? 'TBD'} vs {a?.club ?? 'TBD'}{' '}
                    {f.scheduled_at ? `@ ${new Date(f.scheduled_at).toLocaleString()}` : ''}
                    {f.home_score != null && f.away_score != null
                      ? ` — ${f.home_score}-${f.away_score} (${f.status})`
                      : ''}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        ))}
      </div>
    );
  };

  const renderTables = () => {
    const gs: unknown = groupedStandings;
    const isEmptyArray = Array.isArray(gs) && gs.length === 0;
    const isEmptyRecord =
      !Array.isArray(gs) &&
      gs != null &&
      typeof gs === 'object' &&
      Object.keys(gs as Record<string, unknown>).length === 0;

    if (isEmptyArray || isEmptyRecord) return <p>No tables yet.</p>;

    const byGroup: { [key: string]: Standing[] } = {};
    if (Array.isArray(gs)) {
      for (const s of gs as Standing[]) {
        if (!byGroup[s.group]) byGroup[s.group] = [];
        byGroup[s.group].push(s);
      }
    } else if (gs != null && typeof gs === 'object') {
      const rec = gs as Record<string, Standing[]>;
      for (const [k, arr] of Object.entries(rec)) byGroup[k] = arr;
    }

    if (!Object.keys(byGroup).length) return <p>No tables yet.</p>;

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.keys(byGroup).sort().map((g) => (
          <SectionCard key={g} title={`Group ${g} Table — ${SEASON}`}>
            <table className="table">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-1">Club</th>
                  <th className="py-1 text-right">P</th>
                  <th className="py-1 text-right">W</th>
                  <th className="py-1 text-right">D</th>
                  <th className="py-1 text-right">L</th>
                  <th className="py-1 text-right">GF</th>
                  <th className="py-1 text-right">GA</th>
                  <th className="py-1 text-right">GD</th>
                  <th className="py-1 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {byGroup[g].map((s) => {
                  const e = entrants.find((x) => x.id === s.entrantId);
                  return (
                    <tr key={s.entrantId} className="border-t border-white/10">
                      <td className="py-1 pr-2">{e?.club ?? s.entrantId}</td>
                      <td className="py-1 text-right">{playedOf(s)}</td>
                      <td className="py-1 text-right">{winsOf(s)}</td>
                      <td className="py-1 text-right">{drawsOf(s)}</td>
                      <td className="py-1 text-right">{lossesOf(s)}</td>
                      <td className="py-1 text-right">{gfOf(s)}</td>
                      <td className="py-1 text-right">{gaOf(s)}</td>
                      <td className="py-1 text-right">{gfOf(s) - gaOf(s)}</td>
                      <td className="py-1 text-right font-semibold">{pointsOf(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionCard>
        ))}
      </div>
    );
  };

  const renderKO = () => {
    const k: any = ko;
    const pairs: [string, string][] = Array.isArray(k?.seededPairs) ? k.seededPairs : (Array.isArray(k?.pairs) ? k.pairs : []);
    if (!pairs.length) return <p>No KO bracket yet.</p>;
    return (
      <SectionCard title={`Youth Cup — Round of 32 (seeded) — ${SEASON}`}>
        <ul className="space-y-1">
          {pairs.map(([aId, bId], i) => {
            const a = entrants.find((e) => e.id === aId);
            const b = entrants.find((e) => e.id === bId);
            return (
              <li key={i}>
                {a?.club ?? 'TBD'} vs {b?.club ?? 'TBD'}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    );
  };

  // ---------- UI ----------
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {admin && (
          <>
            <button className="btn bg-white text-black" onClick={addEntrant}>
              + Add Entrant ({SEASON})
            </button>
            <button className="btn" onClick={doDraw}>
              Draw Groups (persist)
            </button>
            <button className="btn border-red-400 hover:bg-red-400/20" onClick={clearEntrants}>
              Clear Entrants ({SEASON})
            </button>
          </>
        )}
      </div>

      <Tabs
        tabs={['Entrants', 'Settings', 'Groups', 'Fixtures', 'Tables', 'Knockout32', 'Admin Notes']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Entrants' && (
        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard title={`Entrants (${entrants.length}) — Season ${SEASON}`}>
            <EntrantsTable entrants={entrants} onClear={admin ? clearEntrants : undefined} />
            <p className="text-xs opacity-70 mt-2">
              {isSupabase ? 'Shared via Supabase.' : 'Local only.'}
            </p>
          </SectionCard>

          <SectionCard title="Actions">
            <div className="space-y-2">
              {admin ? (
                <>
                  <button className="btn" onClick={doDraw}>
                    Draw groups now
                  </button>
                  <button className="btn" onClick={switchSeason}>
                    Switch Season
                  </button>
                </>
              ) : (
                <p className="text-sm opacity-80">Viewing mode only.</p>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'Settings' && (
        <SectionCard title={`Settings — ${SEASON}`}>
          <p className="text-sm opacity-80 mb-2">Season code is managed centrally; this page controls other toggles.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                id="drr"
                type="checkbox"
                className="w-5 h-5"
                checked={!!settings.doubleRoundRobin}
                onChange={(e) =>
                  setSettings({ ...settings, doubleRoundRobin: e.target.checked })
                }
              />
              <label htmlFor="drr">Double round robin (home & away)</label>
            </div>
            <div>
              <label className="block text-sm opacity-80">Age cutoff (YYYY-MM-DD)</label>
              <input
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
                value={settings.ageCutoffISO}
                onChange={(e) => setSettings({ ...settings, ageCutoffISO: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm opacity-80">Timezone</label>
              <input
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {tab === 'Groups' && renderGroups()}
      {tab === 'Fixtures' && renderFixtures()}
      {tab === 'Tables' && renderTables()}
      {tab === 'Knockout32' && renderKO()}

      {tab === 'Admin Notes' && (
        <SectionCard title={`Admin Notes — ${SEASON}`}>
          {admin ? (
            <>
              <textarea
                className="w-full min-h-[240px] px-3 py-2 rounded-xl bg-white/10 border border-white/20"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Use this space for reminders, draw decisions, penalties, disputes, etc."
              />
              <p className="text-xs opacity-70 mt-2">
                Stored {isSupabase ? 'in Supabase (coming soon)' : 'locally in your browser'}.
              </p>
            </>
          ) : (
            <p className="text-sm opacity-80">Admin notes are not visible in viewer mode.</p>
          )}
        </SectionCard>
      )}
    </div>
  );
}