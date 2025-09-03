// src/lib/tournament.ts
import { Entrant, Fixture, Standing, GroupTeam } from "@/lib/types";

/** Simple uid helper */
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Shuffle array (Fisher–Yates)
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assign entrants into N groups, returning a 2D array of GroupTeam,
 * where each inner array is a group's teams.
 */
export function assignGroups(
  entrants: Entrant[],
  groupCount: number
): GroupTeam[][] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const groups: GroupTeam[][] = Array.from({ length: groupCount }, () => []);
  const shuffled = shuffle(entrants);

  shuffled.forEach((e, i) => {
    const gIdx = i % groupCount;
    const label = letters[gIdx] ?? String(gIdx + 1);
    groups[gIdx].push({ group: label, teamId: e.id });
  });

  return groups;
}

/**
 * Create single round-robin fixtures for each group.
 * We do a simple pair-everyone-with-everyone (one leg).
 */
export function createFixtures(groups: GroupTeam[][]): Fixture[] {
  const fixtures: Fixture[] = [];

  for (const group of groups) {
    if (!group.length) continue;
    const groupLabel = group[0].group;

    // naive single round-robin: each pair once; round numbers are 1..N
    let round = 1;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const homeId = group[i].teamId;
        const awayId = group[j].teamId;

        fixtures.push({
          id: uid(),
          stage: "groups",
          round,
          round_label: `Group ${groupLabel} — R${round}`,
          homeId,
          awayId,
          homeGoals: null,
          awayGoals: null,
          kickoff: null,
        });

        round++;
      }
    }
  }

  return fixtures;
}

/**
 * Calculate standings from played fixtures.
 * We infer the group by parsing the fixture.round_label that we generate
 * as "Group X — Rn". If it cannot be parsed, we fall back to "-".
 */
export function calculateStandings(fixtures: Fixture[]): Standing[] {
  type Row = Omit<Standing, "teamId" | "group"> & { teamId: string; group: string };
  const table = new Map<string, Row>();

  const ensure = (teamId: string, groupGuess: string) => {
    if (!table.has(teamId)) {
      table.set(teamId, {
        teamId,
        group: groupGuess,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    } else {
      // If group is unknown and we get a better guess, set it
      const row = table.get(teamId)!;
      if (row.group === "-" && groupGuess !== "-") row.group = groupGuess;
    }
  };

  const parseGroup = (fx: Fixture): string => {
    const lbl = fx.round_label ?? "";
    // Expect "Group A — R1"
    const m = lbl.match(/Group\s+([A-Z])/i);
    return m ? m[1].toUpperCase() : "-";
  };

  for (const fx of fixtures) {
    const group = parseGroup(fx);
    const { homeId, awayId, homeGoals, awayGoals } = fx;

    // Ensure rows exist
    ensure(homeId, group);
    ensure(awayId, group);

    // Only count finished/filled scores
    if (
      typeof homeGoals === "number" &&
      typeof awayGoals === "number"
    ) {
      const H = table.get(homeId)!;
      const A = table.get(awayId)!;

      H.played += 1;
      A.played += 1;

      H.goalsFor += homeGoals;
      H.goalsAgainst += awayGoals;
      A.goalsFor += awayGoals;
      A.goalsAgainst += homeGoals;

      H.goalDifference = H.goalsFor - H.goalsAgainst;
      A.goalDifference = A.goalsFor - A.goalsAgainst;

      if (homeGoals > awayGoals) {
        H.wins += 1;
        A.losses += 1;
        H.points += 3;
      } else if (homeGoals < awayGoals) {
        A.wins += 1;
        H.losses += 1;
        A.points += 3;
      } else {
        // draw
        H.draws += 1;
        A.draws += 1;
        H.points += 1;
        A.points += 1;
      }
    }
  }

  // Sort within groups by points, then GD, then GF
  const rows = Array.from(table.values());
  rows.sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });

  // Cast to Standing[]
  return rows.map((r) => ({
    teamId: r.teamId,
    group: r.group,
    played: r.played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDifference: r.goalDifference,
    points: r.points,
  }));
}