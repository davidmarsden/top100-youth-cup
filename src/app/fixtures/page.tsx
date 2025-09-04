'use client';

import { useEffect, useState } from 'react';

// Types
import { Fixture, Entrant } from '@/lib/types';

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [entrants, setEntrants] = useState<Entrant[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fxRes, enRes] = await Promise.all([
          fetch('/api/fixtures'),
          fetch('/api/entrants'),
        ]);

        if (!fxRes.ok) throw new Error('Failed to load fixtures');
        if (!enRes.ok) throw new Error('Failed to load entrants');

        const fxData: Fixture[] = await fxRes.json();
        const enData: Entrant[] = await enRes.json();

        setFixtures(fxData);
        setEntrants(enData);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  // Helper: map entrant id → club name
  const clubOf = (id: string | null | undefined) =>
    id ? entrants.find((e) => e.id === id)?.club ?? id : 'TBC';

  // Group fixtures by stage
  const byStage: Record<string, Fixture[]> = {};
  fixtures.forEach((f) => {
    const key = f.stage ?? 'Uncategorised';
    if (!byStage[key]) byStage[key] = [];
    byStage[key].push(f);
  });

  // Sort each stage's fixtures by kickoff then id
  Object.keys(byStage).forEach((k) => {
    byStage[k].sort(
      (a, b) =>
        (a.kickoff ?? '').localeCompare(b.kickoff ?? '') ||
        a.id.localeCompare(b.id),
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fixtures</h1>
      <div className="space-y-8">
        {Object.entries(byStage).map(([stage, fx]) => (
          <div key={stage}>
            <h2 className="text-xl font-semibold mb-3">{stage}</h2>
            <div className="grid lg:grid-cols-3 gap-4">
              {fx.map((f) => (
                <div
                  key={f.id}
                  className="border rounded p-3 bg-white shadow-sm"
                >
                  <div className="text-sm text-gray-600 mb-1">
                    {f.kickoff ?? 'TBC'}
                  </div>
                  <div className="font-medium">
                    {clubOf(f.homeId)} vs {clubOf(f.awayId)}
                  </div>
                  {f.homeGoals != null && f.awayGoals != null && (
                    <div className="text-lg font-bold">
                      {f.homeGoals} - {f.awayGoals}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}