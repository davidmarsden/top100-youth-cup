'use client';

import { useEffect, useState } from 'react';
import { Fixture, Entrant } from '@/lib/types';

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [fxRes, enRes] = await Promise.all([
          fetch('/api/fixtures'),
          fetch('/api/entrants'),
        ]);
        const [fxJson, enJson] = await Promise.all([
          fxRes.json(),
          enRes.json(),
        ]);
        setFixtures(fxJson);
        setEntrants(enJson);
      } catch (err) {
        console.error('Failed to load fixtures or entrants', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <p className="p-4">Loading fixtures…</p>;
  }

  // Map fixtures into groups
  const map: Record<string, Fixture[]> = {};
  for (const fx of fixtures) {
    const key =
      fx.stage === 'groups'
        ? 'Groups'
        : fx.stage
        ? fx.stage.replace('_', ' ')
        : 'Other';

    if (!map[key]) map[key] = [];
    map[key].push(fx);
  }

  // Sort fixtures within each group
  Object.keys(map).forEach((k) => {
    map[k].sort(
      (a, b) =>
        (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '') ||
        a.id.localeCompare(b.id)
    );
  });

  const clubOf = (id: string | null | undefined) =>
    id
      ? entrants.find((e) => e.id === id)?.club ?? '(unknown club)'
      : '';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fixtures</h1>

      {Object.keys(map).map((stage) => (
        <div key={stage} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{stage}</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-1 pr-2 text-left">Date</th>
                <th className="py-1 pr-2 text-left">Home</th>
                <th className="py-1 pr-2 text-center">Score</th>
                <th className="py-1 pr-2 text-left">Away</th>
              </tr>
            </thead>
            <tbody>
              {map[stage].map((fx) => (
                <tr key={fx.id} className="border-b">
                  <td className="py-1 pr-2">{fx.scheduledAt ?? 'TBD'}</td>
                  <td className="py-1 pr-2">{clubOf(fx.homeId)}</td>
                  <td className="py-1 pr-2 text-center">
                    {fx.homeGoals != null && fx.awayGoals != null
                      ? `${fx.homeGoals} – ${fx.awayGoals}`
                      : 'vs'}
                  </td>
                  <td className="py-1 pr-2">{clubOf(fx.awayId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}