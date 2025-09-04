// src/lib/tournament.ts
import type { Entrant, Fixture, Standing } from "@/lib/types";

/**
 * Assign entrants to groups A, B, C, ... in round-robin fashion.
 * If you already have groups on each entrant, this preserves them;
 * otherwise it assigns based on index.
 */
export function assignGroups(
  entrants: Entrant[],
  opts: { groupCount: number }
): Record<string, Entrant[]> {
  const { groupCount } = opts;
  const letters = Array.from({ length: groupCount }, (_, i) =>
    String.fromCharCode("A".charCodeAt(0) + i)
  );

  const byGroup: Record<string, Entrant[]> = {};
  letters.forEach((g) => (byGroup[g] = []));

  // If an entrant already has a group, use it; else place by index
  entrants.forEach((e, idx) => {
    const g =
      (typeof (e as any).group === "string" && (e as any).group) ||
      letters[idx % groupCount];
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(e);
  });

  // Stable sort by manager (when present) to keep UI predictable
  for (const g of Object.keys(byGroup)) {
    byGroup[g].sort((a, b) =>
      String((a as any).manager ?? a.id).localeCompare(
        String((b as any).manager ?? b.id)
      )
    );
  }

  return byGroup;
}

/**
 * Round-robin generator per group (single round).
 * Skips BYEs when odd team counts.
 */
export function generateRoundRobinFixtures(
  entrants: Entrant[],
  groups: Record<string, Entrant[]>,
  season: string
): Fixture[] {
  const fixtures: Fixture[] = [];

  Object.entries(groups).forEach(([group, members]) => {
    const ids = members.map((m) => String(m.id));
    if (ids.length < 2) return;

    // add BYE if odd
    const pool = [...ids];
    const hadBye = pool.length % 2 === 1;
    if (hadBye) pool.push("__BYE__");

    const n = pool.length;
    const rounds = n - 1;

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < n / 2; i++) {
        const home = pool[i];
        const away = pool[n - 1 - i];
        if (home === "__BYE__" || away === "__BYE__") continue;

        fixtures.push({
          id: `${season}-${group}-R${r + 1}-${i + 1}`,
          season,
          stage: "Group",
          stageLabel: "Group Stage",
          round: r + 1,
          roundLabel: `Round ${r + 1}`,
          group,

          scheduledAt: null,
          homeId: home,
          awayId: away,

          homeGoals: null,
          awayGoals: null,
          notes: null,
        } as Fixture);
      }

      // rotate (keep index 0 fixed)
      const fixed = pool[0];
      const rest = pool.slice(1);
      rest.unshift(rest.pop()!);
      pool.splice(0, pool.length, fixed, ...rest);
    }
  });

  return fixtures;
}

/**
 * Friendly alias to match your imports in page.tsx.
 */
export function generateFixtures(
  entrants: Entrant[],
  groups: Record<string, Entrant[]>,
  season: string
): Fixture[] {
  return generateRoundRobinFixtures(entrants, groups, season);
}

/**
 * Calculate table standings from fixtures.
 * Assumes 3 pts win, 1 pt draw, 0 loss.
 */
export function calculateStandings(
  fixtures: Fixture[],
  entrants: Entrant[],
  groups: Record<string, Entrant[]>
): Standing[] {
  type Row = Standing & {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };

  // seed rows from entrants (so teams with no games still appear)
  const rows: Record<string, Row> = {};
  const entrantById = new Map(entrants.map((e) => [String(e.id), e]));

  // figure each entrant's group (from groups map)
  const groupOf: Record<string, string> = {};
  Object.entries(groups).forEach(([g, list]) => {
    list.forEach((e) => {
      groupOf[String(e.id)] = g;
    });
  });

  entrants.forEach((e) => {
    const id = String(e.id);
    rows[id] = {
      teamId: id,
      teamName: (e as any).manager ?? id,
      group: groupOf[id] ?? (e as any).group ?? null,

      points: 0,
      goalDiff: 0,

      // extras for calc
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    } as Row;
  });

  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  fixtures.forEach((fx) => {
    const h = rows[String((fx as any).homeId)];
    const a = rows[String((fx as any).awayId)];
    const hg = toNum((fx as any).homeGoals);
    const ag = toNum((fx as any).awayGoals);

    if (!h || !a || hg === null || ag === null) return;

    h.played += 1;
    a.played += 1;
    h.goalsFor += hg;
    h.goalsAgainst += ag;
    a.goalsFor += ag;
    a.goalsAgainst += hg;

    if (hg > ag) {
      h.wins += 1;
      h.points += 3;
      a.losses += 1;
    } else if (hg < ag) {
      a.wins += 1;
      a.points += 3;
      h.losses += 1;
    } else {
      h.draws += 1;
      a.draws += 1;
      h.points += 1;
      a.points += 1;
    }
  });

  // finalize goalDiff and emit as Standing[]
  const result: Standing[] = Object.values(rows).map((r) => {
    r.goalDiff = r.goalsFor - r.goalsAgainst;
    const out: Standing = {
      teamId: r.teamId,
      teamName: r.teamName,
      group: r.group,
      points: r.points,
      goalDiff: r.goalDiff,
    } as Standing;
    return out;
  });

  // sort within groups: points desc, gd desc, name asc
  result.sort((x, y) => {
    const gx = (x as any).group ?? "";
    const gy = (y as any).group ?? "";
    if (gx !== gy) return String(gx).localeCompare(String(gy));
    if (y.points !== x.points) return y.points - x.points;
    if (y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff;
    return String(x.teamName ?? x.teamId).localeCompare(
      String(y.teamName ?? y.teamId)
    );
  });

  return result;
}