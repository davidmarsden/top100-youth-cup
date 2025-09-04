// src/lib/tournament.ts
import type { Entrant, Fixture, Standing, GroupTeam } from '@/lib/types';

/**
 * Assign entrants into N groups as evenly as possible.
 * Returns an array of { group, entrantId }.
 */
export function assignGroups(
  entrants: Entrant[],
  settings: { groupCount: number }
): GroupTeam[] {
  const n = Math.max(1, Math.floor(settings.groupCount || 1));
  const groups: GroupTeam[] = [];
  // deterministic but simple: sort by manager/club/id then round-robin
  const sorted = [...entrants].sort((a, b) => {
    const ak = `${a.seed ?? ''}|${a.club ?? ''}|${a.manager ?? ''}|${a.id}`;
    const bk = `${b.seed ?? ''}|${b.club ?? ''}|${b.manager ?? ''}|${b.id}`;
    return ak.localeCompare(bk);
  });
  sorted.forEach((e, idx) => {
    const groupLetter = String.fromCharCode('A'.charCodeAt(0) + (idx % n));
    groups.push({ group: groupLetter, entrantId: e.id });
  });
  return groups;
}

/**
 * Generate simple round-robin fixtures inside each group.
 * Creates one leg per pairing. Scores are null. kickoff is null.
 */
export function generateFixtures(
  groupTeams: GroupTeam[],
  season: string
): Fixture[] {
  const byGroup: Record<string, string[]> = {};
  groupTeams.forEach(gt => {
    if (!byGroup[gt.group]) byGroup[gt.group] = [];
    byGroup[gt.group].push(gt.entrantId);
  });

  const fixtures: Fixture[] = [];
  Object.entries(byGroup).forEach(([group, teamIds]) => {
    // round-robin pairings (single leg)
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeId = teamIds[i];
        const awayId = teamIds[j];
        fixtures.push({
          id: `${season}:${group}:${homeId}:${awayId}`,
          season,
          stage: 'Group',
          stageLabel: `Group ${group}`,
          round: null,
          roundLabel: null,
          group,
          scheduledAt: null, // you can fill this later in UI/admin
          homeId,
          awayId,
          homeGoals: null,
          awayGoals: null,
        });
      }
    }
  });
  return fixtures;
}

/**
 * Calculate standings per entrant using standard 3/1/0 points and GD.
 * If a fixture has either score null, it is ignored.
 * Optionally carries through group if present on fixtures.
 */
export function calculateStandings(
  fixtures: Fixture[],
  entrants: Entrant[]
): Standing[] {
  // index entrant → group (best-effort) using first matching fixture’s group
  const entrantGroup: Record<string, string | undefined> = {};
  fixtures.forEach(fx => {
    if (fx.group) {
      if (fx.homeId) entrantGroup[fx.homeId] = fx.group;
      if (fx.awayId) entrantGroup[fx.awayId] = fx.group;
    }
  });

  const table: Record<
    string,
    {
      entrantId: string;
      group?: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }
  > = {};

  const ensureRow = (id: string) => {
    if (!table[id]) {
      table[id] = {
        entrantId: id,
        group: entrantGroup[id],
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      };
    }
    return table[id];
  };

  fixtures.forEach(fx => {
    const { homeId, awayId, homeGoals, awayGoals } = fx;
    if (!homeId || !awayId) return;
    if (homeGoals == null || awayGoals == null) return; // ignore unplayed

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
      h.points += 3;
      a.lost += 1;
    } else if (homeGoals < awayGoals) {
      a.won += 1;
      a.points += 3;
      h.lost += 1;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.points += 1;
      a.points += 1;
    }
  });

  // ensure every entrant appears even if no fixtures yet
  entrants.forEach(e => ensureRow(e.id));

  const out: Standing[] = Object.values(table).map(r => ({
    entrantId: r.entrantId,
    group: r.group ?? null,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDiff: r.goalsFor - r.goalsAgainst,
    points: r.points,
  }));

  // sort: group, points desc, GD desc, GF desc, entrantId
  out.sort((x, y) => {
    const g = (x.group ?? '').localeCompare(y.group ?? '');
    if (g !== 0) return g;
    if (y.points !== x.points) return y.points - x.points;
    const gd = (y.goalDiff ?? 0) - (x.goalDiff ?? 0);
    if (gd !== 0) return gd;
    const gf = (y.goalsFor ?? 0) - (x.goalsFor ?? 0);
    if (gf !== 0) return gf;
    return x.entrantId.localeCompare(y.entrantId);
  });

  return out;
}