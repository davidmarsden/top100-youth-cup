"use client";

import type { GroupsByKey } from "@/lib/types";

export default function Groups({ groups }: { groups: GroupsByKey }) {
  const keys = Object.keys(groups);
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Groups</h2>
      <ul className="list-disc ml-6">
        {keys.map(k => {
          const first = groups[k][0];
          const label = first ? `${first.manager}${first.club ? ` (${first.club})` : ""}` : "—";
          return (
            <li key={k}>
              Group {k}: {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}