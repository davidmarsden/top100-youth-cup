'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';

// Components
import SectionCard from '@/components/SectionCard';
import Tabs from '@/components/Tabs';
import EntrantsTable from '@/components/Entrants';
import { useAdmin } from '@/components/AdminGate';

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

export default function AppPage() {
  const { admin } = useAdmin();

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
  const [groups, setGroups] = useState<GroupTeam[]>(() =>
    load<GroupTeam[]>('yc:groups', [])
  );
  useEffect(() => save('yc:groups', groups), [groups]);

  const [fixtures, setFixtures] = useState<Fixture[]>(() =>
    load<Fixture[]>('yc:fixtures', [])
  );
  useEffect(() => save('yc:fixtures', fixtures), [fixtures]);

  // ADMIN NOTES
  const [adminNotes, setAdminNotes] = useState<string>(() =>
    load<string>('yc:adminNotes', '')
  );
  useEffect(() => save('yc:adminNotes', adminNotes), [adminNotes]);

  // TABS
  const [tab, setTab] = useState<string>('Entrants');

  // ---------- SUPABASE INTEGRATION ----------
  useEffect(() => {
    if (!isSupabase) return;
    (async () => {
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: settings.season,
          age_cutoff: settings.ageCutoffISO,
          timezone: settings.timezone,
        }),
      });
      const res = await fetch(`/api/entrants?season=${encodeURIComponent(settings.season)}`);
      const json = await res.json();
      setEntrants(json.entrants || []);

      const fxRes = await fetch(`/api/fixtures?season=${encodeURIComponent(settings.season)}`);
      const fxJson = await fxRes.json();
      if (Array.isArray(fxJson.fixtures)) setFixtures(fxJson.fixtures);
    })();
  }, [settings.season, settings.ageCutoffISO, settings.timezone]);

  // ---------- COMPUTATIONS ----------
  const standings: Standing[] = useMemo(
    () => computeStandings(fixtures, settings, entrants, groups),
    [fixtures, settings, entrants, groups]
  );
  const groupedStandings = useMemo(() => rankWithinGroups(standings), [standings]);
  const ko = useMemo(() => computeKO32(standings, groups, settings), [standings, groups, settings]);

  // ---------- ACTIONS ----------
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
        body: JSON.stringify({
          code: settings.season,
          age_cutoff: settings.ageCutoffISO,
          timezone: settings.timezone,
        }),
      });
      await fetch('/api/entrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season: settings.season,
          manager: manager.trim(),
          club: club.trim(),
          rating: isNaN(Number(rating)) ? undefined : rating,
        }),
      });
      const res = await fetch(`/api/entrants?season=${settings.season}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      setEntrants((e) => [
        ...e,
        {
          id: uid(),
          manager: manager.trim(),
          club: club.trim(),
          rating: isNaN(Number(rating)) ? undefined : rating,
        },
      ]);
    }
  };

  const clearEntrants = async () => {
    if (!confirm('Clear all entrants for this season?')) return;
    if (isSupabase) {
      // server-side proxy (adds ADMIN_KEY)
      await fetch('/api/admin/entrants/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: settings.season }),
      });
      const res = await fetch(`/api/entrants?season=${settings.season}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      setEntrants([]);
      if (typeof window !== 'undefined') window.localStorage.removeItem('yc:entrants');
    }
    alert('Entrants cleared for this season.');
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
        body: JSON.stringify({ season: settings.season, fixtures: payload }),
      });

      const fresh = await fetch(`/api/fixtures?season=${settings.season}`).then((r) => r.json());
      if (fresh.fixtures) setFixtures(fresh.fixtures);
    }

    setTab('Groups');
  };

  const switchSeason = async () => {
    const next = prompt('New season code? (e.g., S27)', settings.season);
    if (!next) return;
    setSettings({ ...settings, season: next });
    if (isSupabase) {
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: next,
          age_cutoff: settings.ageCutoffISO,
          timezone: settings.timezone,
        }),
      });
      const res = await fetch(`/api/entrants?season=${next}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
      const fxRes = await fetch(`/api/fixtures?season=${next}`);
      const fxJson = await fxRes.json();
      setFixtures(fxJson.fixtures || []);
      setGroups([]);
    } else {
      setEntrants([]);
      setGroups([]);
      setFixtures([]);
    }
    alert(`Switched to season ${next}. Previous seasons remain archived.`);
  };

  // ---------- RENDER HELPERS ----------
  const renderGroups = () => {
    if (!groups.length) return <p>No groups yet. Draw to generate groups.</p>;
    const byGroup = groups.reduce<Record<string, GroupTeam[]>>((acc, gt) => {
      (acc[gt.group] ||= []).push(gt);
      return acc;
    }, {});
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.keys(byGroup)
          .sort()
          .map((g) => (
            <SectionCard key={g} title={`Group ${g}`}>
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
    const byRound = fixtures.reduce<Record<string, Fixture[]>>((acc, fx) => {
      (acc[(fx as any).round_label || `Group R${(fx as any).round}`] ||= []).push(fx);
      return acc;
    }, {});
    return (
      <div className="space-y-4">
        {Object.keys(byRound).map((label) => (
          <SectionCard key={label} title={label}>
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
    if (!groupedStandings.length) return <p>No tables yet.</p>;
    const byGroup = groupedStandings.reduce<Record<string, Standing[]>>((acc, s) => {
      (acc[s.group] ||= []).push(s);
      return acc;
    }, {});
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Object.keys(byGroup)
          .sort()
          .map((g) => (
            <SectionCard key={g} title={`Group ${g} Table`}>
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
                        <td className="py-1 text-right">{s.played}</td>
                        <td className="py-1 text-right">{s.won}</td>
                        <td className="py-1 text-right">{s.drawn}</td>
                        <td className="py-1 text-right">{s.lost}</td>
                        <td className="py-1 text-right">{s.gf}</td>
                        <td className="py-1 text-right">{s.ga}</td>
                        <td className="py-1 text-right">{s.gf - s.ga}</td>
                        <td className="py-1 text-right font-semibold">{s.points}</td>
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
    if (!ko || !ko.pairs || !ko.pairs.length) return <p>No KO bracket yet.</p>;
    return (
      <SectionCard title="Youth Cup — Round of 32 (seeded)">
        <ul className="space-y-1">
          {ko.pairs.map((p, i) => {
            const a = entrants.find((e) => e.id === p[0]);
            const b = entrants.find((e) => e.id === p[1]);
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
              + Add Entrant
            </button>
            <button className="btn" onClick={doDraw}>
              Draw Groups (persist)
            </button>
            <button className="btn border-red-400 hover:bg-red-400/20" onClick={clearEntrants}>
              Clear Entrants (Season {settings.season})
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
          <SectionCard title={`Entrants (${entrants.length}) — Season ${settings.season}`}>
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
        <SectionCard title="Settings">
          {admin ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm opacity-80">Season code</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
                    value={settings.season}
                    onChange={(e) => setSettings({ ...settings, season: e.target.value })}
                  />
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
              </div>
              <div className="mt-3">
                <button className="btn" onClick={switchSeason}>
                  Switch Season
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-80">Viewing mode only. Settings are admin-only.</p>
          )}
        </SectionCard>
      )}

      {tab === 'Groups' && renderGroups()}
      {tab === 'Fixtures' && renderFixtures()}
      {tab === 'Tables' && renderTables()}
      {tab === 'Knockout32' && renderKO()}

      {tab === 'Admin Notes' && (
        <SectionCard title="Admin Notes">
          {admin ? (
            <>
              <textarea
                className="w-full min-h-[240px] px-3 py-2 rounded-xl bg-white/10 border border-white/20"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Use this space for reminders, draw decisions, penalties, disputes, etc."
              />
              <p className="text-xs opacity-70 mt-2">
                Stored {isSupabase ? 'in Supabase (wire later)' : 'locally in your browser'}.
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