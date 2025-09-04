"use client";

import type { Entrant } from "@/lib/types";

export default function Entrants({ entrants }: { entrants: Entrant[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Entrants</h2>
      <ul className="list-disc ml-6">
        {entrants.map(e => (
          <li key={e.id}>
            {e.manager}
            {e.club ? ` (${e.club})` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}