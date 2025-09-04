// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Entrant, Fixture, Standing } from "@/lib/types";
import { load, save } from "@/lib/utils";
import { assignGroups, calculateStandings, generateFixtures } from "@/lib/tournament";
import { useAdmin } from "@/components/AdminGate";
import { useSeason } from "@/components/SeasonContext";
import { defaultSettings } from "@/lib/defaults";

export default function HomePage() {
  const SEASON = useSeason();
  const isAdmin = useAdmin();

  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    (async () => {
      // Load entrants
      const savedEntrants = await load<Entrant[]>("yc:entrants", SEASON);
      const es = savedEntrants ?? [];
      setEntrants(es);

      // Assign groups
      const groupedTeams = assignGroups(es, { groupCount: defaultSettings.groupCount });
      setGroups(groupedTeams);

      // Load fixtures
      const savedFixtures = await load<Fixture[]>("yc:fixtures", SEASON);
      const fs = savedFixtures ?? generateFixtures(groupedTeams, SEASON);
      setFixtures(fs);

      // Calculate standings
      const st = calculateStandings(fs, groupedTeams);
      setStandings(st);
    })();
  }, [SEASON]);

  // ---- FIX: normalize group key so it's always a string ----
  const standingsByGroup = standings.reduce<Record<string, Standing[]>>((acc, s) => {
    const key = s.group ?? "Ungrouped";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <main className="p-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Top 100 Youth Cup</h1>
        <p className="text-gray-500">Season {SEASON}</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold">Entrants</h2>
        <ul className="list-disc ml-6">
          {entrants.map((e) => (
            <li key={e.id}>
              {e.manager} {e.club ? `(${e.club})` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Fixtures</h2>
        <ul className="list-disc ml-6">
          {fixtures.map((f) => (
            <li key={f.id}>
              {f.homeName} vs {f.awayName} – {f.roundLabel || f.stageLabel}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Standings</h2>
        {Object.entries(standingsByGroup).map(([group, sts]) => (
          <div key={group} className="mb-4">
            <h3 className="font-bold">Group {group}</h3>
            <ul className="list-disc ml-6">
              {sts.map((s) => (
                <li key={s.teamId}>
                  {s.teamName} – {s.points} pts
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {isAdmin && (
        <section>
          <h2 className="text-2xl font-semibold">Admin Controls</h2>
          <button
            onClick={async () => {
              await save("yc:entrants", entrants, SEASON);
              await save("yc:fixtures", fixtures, SEASON);
              alert("Saved entrants & fixtures");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save Data
          </button>
        </section>
      )}
    </main>
  );
}