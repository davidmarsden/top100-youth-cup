// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Entrant, GroupTeam, Fixture, Standing } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";
import { load, save } from "@/lib/utils";
import { assignGroups, calculateStandings, generateFixtures } from "@/lib/tournament";

export default function HomePage() {
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [groups, setGroups] = useState<GroupTeam[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  // Bootstrap minimal demo data once if no entrants saved
  useEffect(() => {
    (async () => {
      const es = await load<Entrant[]>("yc:entrants", []);
      const initial =
        es.length > 0
          ? es
          : [
              { id: "t1", manager: "Alice", club: "Rovers" },
              { id: "t2", manager: "Bob", club: "City" },
              { id: "t3", manager: "Cara", club: "United" },
              { id: "t4", manager: "Dan", club: "Town" },
            ];
      setEntrants(initial);

      const grouped = assignGroups(initial, { groupCount: defaultSettings.groupCount });
      setGroups(grouped);

      const savedFx = await load<Fixture[]>("yc:fixtures", []);
      const fx = savedFx.length ? savedFx : generateFixtures(grouped);
      setFixtures(fx);

      const st = calculateStandings(fx, initial, grouped);
      setStandings(st);
    })();
  }, []);

  const standingsByGroup = standings.reduce<Record<string, Standing[]>>((acc, s) => {
    const key = s.group ?? "Ungrouped";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <main className="p-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Top 100 Youth Cup</h1>
        <p className="text-gray-500">Season {defaultSettings.season}</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Entrants</h2>
        <ul className="list-disc ml-6">
          {entrants.map((e) => (
            <li key={e.id}>
              {e.manager} {e.club ? `(${e.club})` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Groups</h2>
        <ul className="list-disc ml-6">
          {groups.map((g, idx) => (
            <li key={`${g.group}-${idx}`}>
              Group {g.group}: {g.manager} {g.club ? `(${g.club})` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Fixtures</h2>
        <ul className="list-disc ml-6">
          {fixtures.map((f) => (
            <li key={f.id}>
              [{f.group}] {f.homeId} vs {f.awayId} {f.roundLabel ? `– ${f.roundLabel}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Standings</h2>
        {Object.keys(standingsByGroup).map((g) => (
          <div key={g} className="mb-4">
            <h3 className="font-bold">Group {g}</h3>
            <ul className="list-disc ml-6">
              {standingsByGroup[g].map((s) => (
                <li key={s.teamId}>
                  {s.teamName}: {s.points} pts (P{s.played}, W{s.won}, D{s.drawn}, L{s.lost})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="space-x-3">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={async () => {
            await save("yc:entrants", entrants);
            await save("yc:fixtures", fixtures);
            alert("Saved to localStorage");
          }}
        >
          Save
        </button>

        <button
          className="px-4 py-2 rounded bg-gray-200"
          onClick={async () => {
            const grouped = assignGroups(entrants, { groupCount: defaultSettings.groupCount });
            setGroups(grouped);
            const fx = generateFixtures(grouped);
            setFixtures(fx);
            const st = calculateStandings(fx, entrants, grouped);
            setStandings(st);
          }}
        >
          Rebuild fixtures & table
        </button>
      </div>
    </main>
  );
}