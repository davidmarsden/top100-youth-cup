"use client";

import type { Fixture, Entrant } from "@/lib/types";

export default function FixturesList({
  fixtures,
  entrants,
}: {
  fixtures: Fixture[];
  entrants: Entrant[];
}) {
  const byId = new Map(entrants.map(e => [e.id, e]));
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Fixtures</h2>
      {fixtures.length === 0 ? (
        <p className="text-sm text-gray-500">No fixtures yet.</p>
      ) : (
        <ul className="list-disc ml-6">
          {fixtures.map(f => (
            <li key={f.id}>
              [{f.group ?? "—"}] {byId.get(f.homeId)?.manager ?? f.homeId} vs{" "}
              {byId.get(f.awayId)?.manager ?? f.awayId}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}