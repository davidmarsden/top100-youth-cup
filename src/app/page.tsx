'use client';

import React, { useEffect, useState } from 'react';
import { defaultSettings } from '@/lib/defaults';
import { Entrant, Fixture, Standing, Settings } from '@/lib/types';
import { load, save } from '@/lib/utils';
import { assignGroups, calculateStandings, generateFixtures } from '@/lib/tournament';
import { useAdmin } from '@/components/AdminGate';
import { useSeason } from '@/components/SeasonContext';

export default function Page() {
  const { admin } = useAdmin();
  const { season } = useSeason();

  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [groups, setGroups] = useState<Record<string, Entrant[]>>({});
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [settings] = useState<Settings>(defaultSettings);

  // Load saved data
  useEffect(() => {
    (async () => {
      const savedEntrants = await load<Entrant[]>('entrants', []);
      const es = savedEntrants ?? [];
      setEntrants(es);

      const groupTeams = assignGroups(es, defaultSettings.groupCount);
      setGroups(groupTeams);

      const savedFixtures = await load<Fixture[]>(season, 'fixtures');
      setFixtures(savedFixtures ?? []);

      const savedStandings = await load<Standing[]>(season, 'standings');
      setStandings(savedStandings ?? []);
    })();
  }, [season]);

  const doDraw = async () => {
    const groupTeams = assignGroups(es, { groupCount: defaultSettings.groupCount });


    const newFixtures = generateFixtures(groupTeams, season);
    setFixtures(newFixtures);

    await save(season, 'entrants', entrants);
    await save(season, 'groups', groupTeams);
    await save(season, 'fixtures', newFixtures);

    const newStandings = calculateStandings(newFixtures);
    setStandings(newStandings);
    await save(season, 'standings', newStandings);
  };

  const clearEntrants = async () => {
    setEntrants([]);
    setGroups({});
    setFixtures([]);
    setStandings([]);
    await save(season, 'entrants', []);
    await save(season, 'groups', {});
    await save(season, 'fixtures', []);
    await save(season, 'standings', []);
  };

  const byGroup: Record<string, Standing[]> = {};
  standings.forEach((s) => {
    if (!byGroup[s.group]) byGroup[s.group] = [];
    byGroup[s.group].push(s);
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Youth Cup {season}</h1>

      {admin && (
        <div className="flex gap-2 mb-4">
          <button className="btn" onClick={doDraw}>
            Draw Groups
          </button>
          <button className="btn border-red-400" onClick={clearEntrants}>
            Clear Entrants
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {Object.keys(byGroup).map((g) => (
          <div key={g} className="border rounded p-2">
            <h2 className="font-semibold mb-2">Group {g}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {byGroup[g].map((s) => {
                  const e = entrants.find((x) => x.id === s.entrantId);
                  return (
                    <tr key={s.entrantId} className="border-b last:border-0">
                      <td className="py-1 pr-2">
                        {e ? e.club ?? e.manager ?? e.id : s.entrantId}
                      </td>
                      <td className="py-1 text-right">{s.played}</td>
                      <td className="py-1 text-right">{s.won}</td>
                      <td className="py-1 text-right">{s.drawn}</td>
                      <td className="py-1 text-right">{s.lost}</td>
                      <td className="py-1 text-right">{s.goalsFor}</td>
                      <td className="py-1 text-right">{s.goalsAgainst}</td>
                      <td className="py-1 text-right">{s.goalDifference}</td>
                      <td className="py-1 text-right font-semibold">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}