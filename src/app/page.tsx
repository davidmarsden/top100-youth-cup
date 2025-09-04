// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Entrant, Fixture, GroupTeam, Standing } from "@/lib/types";
import { load, save } from "@/lib/utils";
import {
  assignGroups,
  calculateStandings,
  generateFixtures,
} from "@/lib/tournament";
import { useAdmin } from "@/components/AdminGate";
import { useSeason } from "@/components/SeasonContext";

export default function HomePage() {
  const { admin } = useAdmin();
  const { season } = useSeason();

  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [groups, setGroups] = useState<GroupTeam[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  const defaultSettings = { groupCount: 4 };

  useEffect(() => {
    (async () => {
      const savedEntrants = await load<Entrant[]>("entrants");
      const es = savedEntrants ?? [];
      setEntrants(es);

      if (es.length > 0) {
        const groupTeams = assignGroups(es, {
          groupCount: defaultSettings.groupCount,
        });
        setGroups(groupTeams);

        const savedFixtures = await load<Fixture[]>("fixtures");
        const fs = savedFixtures ?? generateFixtures(groupTeams);
        setFixtures(fs);

        const standings = calculateStandings(groupTeams, fs);
        setStandings(standings);
      }
    })();
  }, []);

  const handleSave = async () => {
    await save("entrants", entrants);
    await save("fixtures", fixtures);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Youth Cup – Season {season}
      </h1>

      {admin && (
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Data
          </button>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold">Groups</h2>
        <ul className="list-disc ml-6">
          {groups.map((g) => (
            <li key={g.id}>
              {g.group} – {g.manager} ({g.club})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Fixtures</h2>
        <ul className="list-disc ml-6">
          {fixtures.map((fx) => (
            <li key={fx.id}>
              {fx.stageLabel ?? fx.stage} – {fx.homeId} vs {fx.awayId}
              {fx.homeGoals != null && fx.awayGoals != null
                ? ` (${fx.homeGoals}–${fx.awayGoals})`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Standings</h2>
        {Object.entries(
          standings.reduce<Record<string, Standing[]>>((acc, s) => {
            if (!acc[s.group]) acc[s.group] = [];
            acc[s.group].push(s);
            return acc;
          }, {})
        ).map(([g, rows]) => (
          <div key={g} className="mb-4">
            <h3 className="font-bold">Group {g}</h3>
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">Team</th>
                  <th className="px-2 py-1 border">P</th>
                  <th className="px-2 py-1 border">W</th>
                  <th className="px-2 py-1 border">D</th>
                  <th className="px-2 py-1 border">L</th>
                  <th className="px-2 py-1 border">GF</th>
                  <th className="px-2 py-1 border">GA</th>
                  <th className="px-2 py-1 border">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const e = entrants.find((x) => x.id === s.teamId);
                  return (
                    <tr key={s.teamId}>
                      <td className="border px-2 py-1">
                        {e?.manager} ({e?.club})
                      </td>
                      <td className="border px-2 py-1">{s.played}</td>
                      <td className="border px-2 py-1">{s.won}</td>
                      <td className="border px-2 py-1">{s.drawn}</td>
                      <td className="border px-2 py-1">{s.lost}</td>
                      <td className="border px-2 py-1">{s.goalsFor}</td>
                      <td className="border px-2 py-1">{s.goalsAgainst}</td>
                      <td className="border px-2 py-1 font-bold">
                        {s.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}