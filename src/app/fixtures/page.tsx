// src/app/fixtures/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Fixture, Entrant } from '@/lib/types';

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [fxRes, eRes] = await Promise.all([
          fetch('/api/fixtures').then(r => r.json()),
          fetch('/api/entrants').then(r => r.json()),
        ]);
        setFixtures(fxRes);
        setEntrants(eRes);
      } catch (err) {
        console.error('Error loading fixtures/entrants', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="p-4">Loading fixtures…</p>;

  // helper: find entrant’s club by ID
  const clubOf = (id: string | null | undefined) =>
    id ? entrants.find(e => e.id === id)?.club ?? '' : '';

  // group fixtures by stage (use camelCase stageLabel)
  const byStage: Record<string, Fixture[]> = {};
  fixtures.forEach(fx => {
    const k = fx.stageLabel ?? 'Unknown';
    if (!byStage[k]) byStage[k] = [];
    byStage[k].push(fx);
  });
  Object.keys(byStage).forEach(k => {
    byStage[k].sort(
      (a, b) =>
        (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '') ||
        a.id.localeCompare(b.id),
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fixtures & Results</h1>
      <div className="space-y-8">
        {Object.keys(byStage).map(stage => (
          <div key={stage}>
            <h2 className="text-xl font-semibold mb-2">{stage}</h2>
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Home</th>
                  <th className="px-2 py-1 text-left">Score</th>
                  <th className="px-2 py-1 text-left">Away</th>
                </tr>
              </thead>
              <tbody>
                {byStage[stage].map(fx => (
                  <tr key={fx.id} className="border-t">
                    <td className="px-2 py-1">
                      {fx.scheduledAt
                        ? new Date(fx.scheduledAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-2 py-1">{clubOf(fx.homeId)}</td>
                    <td className="px-2 py-1 text-center">
                      {fx.homeGoals != null && fx.awayGoals != null
                        ? `${fx.homeGoals} – ${fx.awayGoals}`
                        : 'vs'}
                    </td>
                    <td className="px-2 py-1">{clubOf(fx.awayId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}