"use client";

import type { Standing, Entrant } from "@/lib/types";

export default function StandingsTable({
  standings,
  entrants,
}: {
  standings: Standing[];
  entrants: Entrant[];
}) {
  const byId = new Map(entrants.map(e => [e.id, e]));
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Standings</h2>
      {standings.length === 0 ? (
        <p className="text-sm text-gray-500">No matches played.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[520px] text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pr-4">Team</th>
                <th className="pr-2">P</th>
                <th className="pr-2">W</th>
                <th className="pr-2">D</th>
                <th className="pr-2">L</th>
                <th className="pr-2">GF</th>
                <th className="pr-2">GA</th>
                <th className="pr-2">GD</th>
                <th className="pr-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map(s => {
                const e = byId.get(s.teamId);
                const name = e ? `${e.manager}${e.club ? ` (${e.club})` : ""}` : s.teamId;
                return (
                  <tr key={s.teamId}>
                    <td className="pr-4">{name}</td>
                    <td className="pr-2">{s.played}</td>
                    <td className="pr-2">{s.wins}</td>
                    <td className="pr-2">{s.draws}</td>
                    <td className="pr-2">{s.losses}</td>
                    <td className="pr-2">{s.gf}</td>
                    <td className="pr-2">{s.ga}</td>
                    <td className="pr-2">{s.gd}</td>
                    <td className="pr-2 font-semibold">{s.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}