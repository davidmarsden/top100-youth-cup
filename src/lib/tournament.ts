import type { Entrant, Fixture, GroupKey, GroupsByKey, Standing } from "@/lib/types";

/** Split entrants into A.. groups (round-robin) */
export function assignGroups(
  entrants: Entrant[],
  { groupCount }: { groupCount: number }
): GroupsByKey {
  const keys: GroupKey[] = Array.from({ length: groupCount }, (_, i) =>
    String.fromCharCode("A".charCodeAt(0) + i)
  );
  const groups: GroupsByKey = Object.fromEntries(keys.map(k => [k, []]));

  const sorted = entrants.slice().sort((a, b) =>
    (a.manager ?? "").localeCompare(b.manager ?? "")
  );

  sorted.forEach((e, idx) => {
    const k = keys[idx % keys.length];
    groups[k].push(e);
  });

  return groups;
}

/** One-leg round robin inside each group; deterministic ids */
export function generateFixtures(groups: GroupsByKey): Fixture[] {
  const fixtures: Fixture[] = [];
  Object.entries(groups).forEach(([groupKey, entrants]) => {
    for (let i = 0; i < entrants.length; i++) {
      for (let j = i + 1; j < entrants.length; j++) {
        const home = entrants[i];
        const away = entrants[j];
        fixtures.push({
          id: `${groupKey}-${home.id}-${away.id}`,
          group: groupKey,
          round: null,
          scheduledAt: null,
          homeId: home.id,
          awayId: away.id,
          homeGoals: null,
          awayGoals: null,
        });
      }
    }
  });
  return fixtures;
}

/** Simple table calculator from played fixtures */
export function calculateStandings(
  fixtures: Fixture[],
  entrants: Entrant[],
  groups: GroupsByKey
): Standing[] {
  const byId = new Map(entrants.map(e => [e.id, e]));
  const rows = new Map<string, Standing>();

  const ensure = (teamId: string, group: GroupKey | null) => {
    if (!rows.has(teamId)) {
      rows.set(teamId, {
        teamId,
        group,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      });
    }
    return rows.get(teamId)!;
  };

  fixtures.forEach(f => {
    const g = f.group ?? null;
    const h = ensure(f.homeId, g);
    const a = ensure(f.awayId, g);

    if (f.homeGoals == null || f.awayGoals == null) return;

    h.played++; a.played++;
    h.gf += f.homeGoals; h.ga += f.awayGoals;
    a.gf += f.awayGoals; a.ga += f.homeGoals;
    h.gd = h.gf - h.ga; a.gd = a.gf - a.ga;

    if (f.homeGoals > f.awayGoals) { h.wins++; h.points += 3; a.losses++; }
    else if (f.homeGoals < f.awayGoals) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  });

  // Ensure teams with no matches still appear
  Object.values(groups).forEach(list =>
    list.forEach(e => ensure(e.id, null))
  );

  return Array.from(rows.values()).sort((x, y) =>
    (y.points - x.points) ||
    (y.gd - x.gd) ||
    (y.gf - x.gf) ||
    (byId.get(x.teamId)?.manager ?? "").localeCompare(byId.get(y.teamId)?.manager ?? "")
  );
}