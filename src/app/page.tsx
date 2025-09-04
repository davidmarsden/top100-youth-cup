// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Entrant, Fixture, Standing } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";
import { load, save } from "@/lib/utils";
import {
  assignGroups,
  generateFixtures,
  calculateStandings,
} from "@/lib/tournament";

export default function HomePage() {
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  // ⬇⬇⬇ FIX: groups is a Record<string, Entrant[]>, not GroupTeam[]
  const [groups, setGroups] = useState<Record<string, Entrant[]>>({});
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    (async () => {
      // Load entrants (may be null)
      const es = await load<Entrant[]>("yc:entrants");
      const initial: Entrant[] =
        (es && es.length > 0 ? es : []) || [
          // fallbacks if nothing is stored yet (safe defaults)
          { id: "t1", manager: "Alice", club: "Lions" } as Entrant,
          { id: "t2", manager: "Bob", club: "Tigers" } as Entrant,
          { id: "t3", manager: "Cara", club: "Bears" } as Entrant,
          { id: "t4", manager: "Dax", club: "Wolves" } as Entrant,
        ];

      setEntrants(initial);

      // Create groups from entrants
      const grouped = assignGroups(initial, {
        groupCount: defaultSettings.groupCount,
      });

      // ⬇⬇⬇ FIX: pass the Record<string, Entrant[]> to state
      setGroups(grouped);

      // Load fixtures (may be null) or generate new
      const savedFx = await load<Fixture[]>("yc:fixtures");
      const fx: Fixture[] =
        (savedFx && savedFx.length > 0 ? savedFx : null) ??
        generateFixtures(initial, grouped, defaultSettings.season);

      setFixtures(fx);

      // Calculate standings
      const st = calculateStandings(fx, initial, grouped);
      setStandings(st);

      // Persist what we’ve derived (best-effort; ignore errors)
      try {
        await save("yc:entrants", initial);
        await save("yc:fixtures", fx);
      } catch {
        // no-op on write failures (e.g., SSR or locked storage)
      }
    })();
  }, []);

  // Small helpers for rendering safely
  const groupsEntries = Object.entries(groups); // [ [group, Entrant[]], ... ]

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Top100 Youth Cup — Home</h1>
        <p className="text-sm text-gray-500">
          Demo view with local entrants, group allocation, fixtures, and a basic
          table calculator.
        </p>
      </header>

      {/* Entrants */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Entrants</h2>
        <ul className="list-disc ml-6">
          {entrants.map((e) => (
            <li key={String(e.id)}>
              {e.manager ?? e.id}
              {e.club ? ` (${e.club})` : ""}
            </li>
          ))}
        </ul>
      </section>

      {/* Groups */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Groups</h2>
        {groupsEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No groups yet.</p>
        ) : (
          <div className="space-y-4">
            {groupsEntries.map(([g, list]) => (
              <div key={g} className="rounded border p-3">
                <div className="font-medium mb-1">Group {g}</div>
                <ul className="list-disc ml-6">
                  {list.map((e) => (
                    <li key={String(e.id)}>
                      {e.manager ?? e.id}
                      {e.club ? ` (${e.club})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fixtures */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Fixtures</h2>
        {fixtures.length === 0 ? (
          <p className="text-sm text-gray-500">No fixtures generated.</p>
        ) : (
          <ul className="space-y-1">
            {fixtures.map((fx) => {
              const h = fx.homeId;
              const a = fx.awayId;
              const hg =
                fx.homeGoals === null || fx.homeGoals === undefined
                  ? "—"
                  : String(fx.homeGoals);
              const ag =
                fx.awayGoals === null || fx.awayGoals === undefined
                  ? "—"
                  : String(fx.awayGoals);
              return (
                <li key={fx.id} className="text-sm">
                  [{fx.group}] R{fx.round}: {h} vs {a} — {hg}:{ag}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Standings */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Standings</h2>
        {standings.length === 0 ? (
          <p className="text-sm text-gray-500">No standings yet.</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border">Group</th>
                <th className="text-left p-2 border">Team</th>
                <th className="text-right p-2 border">Pts</th>
                <th className="text-right p-2 border">GD</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={`${s.group ?? ""}-${s.teamId}`}>
                  <td className="p-2 border">{s.group ?? "—"}</td>
                  <td className="p-2 border">
                    {s.teamName ?? s.teamId ?? "—"}
                  </td>
                  <td className="p-2 border text-right">{s.points}</td>
                  <td className="p-2 border text-right">{s.goalDiff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}