"use client";

import { useEffect, useState } from "react";
import { defaultSettings } from "@/lib/defaults";
import { Entrant, Fixture, Standing, GroupTeam } from "@/lib/types";
import { load, save } from "@/lib/utils";
import {
  assignGroups,
  calculateStandings,
  createFixtures,
} from "@/lib/tournament";

export default function HomePage() {
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [groups, setGroups] = useState<GroupTeam[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);

      // Load entrants
      const savedEntrants = await load<Entrant[]>("entrants");
      const es = savedEntrants ?? [];
      setEntrants(es);

      // Assign groups
      const groupTeams = assignGroups(es, defaultSettings.groupCount);
      setGroups(groupTeams);

      // Load fixtures
      const savedFixtures = await load<Fixture[]>("fixtures");
      if (savedFixtures && savedFixtures.length > 0) {
        setFixtures(savedFixtures);
      } else {
        const fs = createFixtures(groupTeams);
        setFixtures(fs);
        await save("fixtures", fs);
      }

      // Calculate standings
      const st = calculateStandings(savedFixtures ?? []);
      setStandings(st);

      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  const byGroup: Record<string, Standing[]> = {};
  standings.forEach((s) => {
    if (!byGroup[s.group]) byGroup[s.group] = [];
    byGroup[s.group].push(s);
  });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Youth Cup — Groups</h1>

      {Object.keys(byGroup).map((g) => (
        <div key={g} className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Group {g}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="py-1 pr-2">Team</th>
                  <th className="py-1 pr-2 text-center">P</th>
                  <th className="py-1 pr-2 text-center">W</th>
                  <th className="py-1 pr-2 text-center">D</th>
                  <th className="py-1 pr-2 text-center">L</th>
                  <th className="py-1 pr-2 text-center">GF</th>
                  <th className="py-1 pr-2 text-center">GA</th>
                  <th className="py-1 pr-2 text-center">GD</th>
                  <th className="py-1 pr-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {byGroup[g].map((s) => {
                  const e = entrants.find((x) => x.id === s.teamId);
                  return (
                    <tr
                      key={s.teamId}
                      className="border-t border-white/10"
                    >
                      <td className="py-1 pr-2">{e ? e.name : "Unknown"}</td>
                      <td className="py-1 pr-2 text-center">{s.played}</td>
                      <td className="py-1 pr-2 text-center">{s.wins}</td>
                      <td className="py-1 pr-2 text-center">{s.draws}</td>
                      <td className="py-1 pr-2 text-center">{s.losses}</td>
                      <td className="py-1 pr-2 text-center">{s.goalsFor}</td>
                      <td className="py-1 pr-2 text-center">{s.goalsAgainst}</td>
                      <td className="py-1 pr-2 text-center">{s.goalDifference}</td>
                      <td className="py-1 pr-2 text-center font-semibold">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
}