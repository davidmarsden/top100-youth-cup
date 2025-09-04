// src/lib/tournament.ts
import type { Entrant, GroupTeam, Fixture, Standing } from "@/lib/types";

/** Assign entrants to groups A.. based on index (simple round-robin bucket). */
export function assignGroups(
  entrants: Entrant[],
  opts: { groupCount: number }
): GroupTeam[] {
  const groups: GroupTeam[] = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const count = Math.max(1, Math.min(opts.groupCount || 1, letters.length));

  entrants.forEach((e, idx) => {
    const g = letters[idx % count];
    groups.push({
      group: g,
      entrantId: e.id,
      manager: e.manager,
      club: e.club ?? null,
    });
  });

  return groups;
}

/** Generate simple single round-robin fixtures inside each group. */
export function generateFixtures(grouped: GroupTeam[]): Fixture[] {
  const byGroup = grouped.reduce<Record<string, GroupTeam[]>>((acc, gt) => {
    (acc[gt.group] ||= []).push(gt);
    return acc;
  }, {});

  const fixtures: Fixture[] = [];
  Object.entries(byGroup).forEach(([group, teams]) => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const a = teams[i];
        const b = teams[j];
        fixtures.push({
          id: `${group}-${a.entrantId}-${b.entrantId}`,
          group,
          homeId: a.entrantId,
          awayId: b.entrantId,
          roundLabel: "Group",
          stageLabel: "Group Stage",
          scheduledAt: null,
          homeGoals: null,
          awayGoals: null,
        });
      }
    }
  });

  return fixtures;
}

/** Calculate standings from fixtures (3 win, 1 draw, 0 loss). */
export function calculateStandings(
  fixtures: Fixture[],
  entrants: Entrant[],
  grouped: GroupTeam[]
): Standing[] {
  const nameMap = new Map<string, string>();
  entrants.forEach((e) => {
    const name = e.club ? `${e.manager} (${e.club})` : e.manager;
    nameMap.set(e.id, name);
  });
  const groupMap = new Map<string, string | null>();
  grouped.forEach((g) => groupMap.set(g.entrantId, g.group));

  const table = new Map<string, Standing>();

  function ensureRow(teamId: string) {
    if (!table.has(teamId)) {
      table.set(teamId, {
        teamId,
        teamName: nameMap.get(teamId) ?? teamId,
        group: groupMap.get(teamId) ?? null,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
    return table.get(teamId)!;
  }

  fixtures.forEach((fx) => {
    const { homeId, awayId, homeGoals, awayGoals } = fx;
    if (homeGoals == null || awayGoals == null) return;

    const h = ensureRow(homeId);
    const a = ensureRow(awayId);

    h.played += 1;
    a.played += 1;
    h.goalsFor += homeGoals;
    h.goalsAgainst += awayGoals;
    a.goalsFor += awayGoals;
    a.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      h.won += 1;
      a.lost += 1;
      h.points += 3;
    } else if (homeGoals < awayGoals) {
      a.won += 1;
      h.lost += 1;
      a.points += 3;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.points += 1;
      a.points += 1;
    }
  });

  const rows = Array.from(table.values());
  rows.sort((x, y) => {
    // group, points desc, GD desc, goalsFor desc, name asc
    const gx = x.group ?? "";
    const gy = y.group ?? "";
    if (gx !== gy) return gx.localeCompare(gy);
    if (y.points !== x.points) return y.points - x.points;
    const gdX = x.goalsFor - x.goalsAgainst;
    const gdY = y.goalsFor - y.goalsAgainst;
    if (gdY !== gdX) return gdY - gdX;
    if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor;
    return x.teamName.localeCompare(y.teamName);
  });

  return rows;
}