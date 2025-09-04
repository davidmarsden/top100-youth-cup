// src/lib/tournament.ts
import type { Entrant, Fixture } from "@/lib/types";

/**
 * Generate single round-robin fixtures within each group.
 * Uses the "circle method" and skips BYEs.
 */
export function generateRoundRobinFixtures(
  entrants: Entrant[],
  groups: Record<string, Entrant[]>,
  season: string
): Fixture[] {
  const fixtures: Fixture[] = [];

  Object.entries(groups).forEach(([group, teamsRaw]) => {
    // Ensure we only include entrants that exist in the master list (defensive)
    const validIds = new Set(entrants.map(e => e.id));
    const teams = teamsRaw.filter(t => validIds.has(t.id)).map(t => t.id);

    if (teams.length < 2) return;

    // Round-robin "circle" setup (add BYE if odd)
    const hasBye = teams.length % 2 === 1;
    const teamIds = [...teams];
    if (hasBye) teamIds.push("__BYE__");

    const n = teamIds.length;
    const rounds = n - 1;

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < n / 2; i++) {
        const home = teamIds[i];
        const away = teamIds[n - 1 - i];

        if (home === "__BYE__" || away === "__BYE__") continue;

        fixtures.push({
          id: `${season}-${group}-R${r + 1}-${i + 1}`,
          season,
          stage: "Group",
          round: r + 1,
          roundLabel: `Round ${r + 1}`,
          stageLabel: "Group Stage",
          group,

          scheduledAt: null, // fill later if you want
          homeId: String(home),
          awayId: String(away),

          homeGoals: null,
          awayGoals: null,
          notes: null,
        });
      }

      // rotate (keep index 0 fixed)
      // [A, B, C, D] -> [A, D, B, C] -> [A, C, D, B] ...
      const fixed = teamIds[0];
      const rest = teamIds.slice(1);
      rest.unshift(rest.pop()!);
      teamIds.splice(0, teamIds.length, fixed, ...rest);
    }
  });

  return fixtures;
}