"use client";

import { useEffect, useState } from "react";
import type { Entrant, Fixture, GroupsByKey, Standing } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";
import { load, save } from "@/lib/utils";
import { assignGroups, generateFixtures, calculateStandings } from "@/lib/tournament";

import EntrantsSection from "@/components/Entrants";
import GroupsSection from "@/components/Groups";
import FixturesList from "@/components/FixturesList";
import StandingsTable from "@/components/StandingsTable";

export default function HomePage() {
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [groups, setGroups] = useState<GroupsByKey>({});
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  // bootstrap demo entrants (same as the screenshot)
  useEffect(() => {
    (async () => {
      const es = (await load<Entrant[]>("yc:entrants")) ?? [
        { id: "t1", manager: "Alice", club: "Rovers" },
        { id: "t2", manager: "Bob", club: "City" },
        { id: "t3", manager: "Cara", club: "United" },
        { id: "t4", manager: "Dan", club: "Town" },
      ];
      setEntrants(es);

      const grouped = assignGroups(es, { groupCount: defaultSettings.groupCount });
      setGroups(grouped);

      const savedFx = (await load<Fixture[]>("yc:fixtures")) ?? [];
      const fx: Fixture[] = savedFx.length > 0 ? savedFx : generateFixtures(grouped);
      setFixtures(fx);

      const st = calculateStandings(fx, es, grouped);
      setStandings(st);
    })();
  }, []);

  const handleSave = async () => {
    await save("yc:entrants", entrants);
    await save("yc:fixtures", fixtures);
  };

  const handleRebuild = () => {
    const grouped = assignGroups(entrants, { groupCount: defaultSettings.groupCount });
    setGroups(grouped);
    const fx = generateFixtures(grouped);
    setFixtures(fx);
    const st = calculateStandings(fx, entrants, grouped);
    setStandings(st);
  };

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Top 100 Youth Cup</h1>
        <p className="text-sm text-gray-500">Season 26</p>
<p className="text-xs text-gray-500">
  <a className="underline" href="/draw">Go to Prize Draw →</a>
</p>
      </header>

      <div className="space-y-10 mt-8">
        <EntrantsSection entrants={entrants} />
        <GroupsSection groups={groups} />
        <FixturesList fixtures={fixtures} entrants={entrants} />
        <StandingsTable standings={standings} entrants={entrants} />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleRebuild}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Rebuild fixtures &amp; table
          </button>
        </div>
      </div>
    </>
  );
}