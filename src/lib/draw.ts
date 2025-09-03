// src/lib/draw.ts
import { Entrant, Fixture, GroupTeam, Settings, Standing } from './types';

// ---------- utils ----------
function uid() {
  // safe fallback for environments without crypto.randomUUID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any)?.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- 1) Assign groups ----------
/**
 * Distributes entrants into groups A..Z based on settings.
 * - Uses `maxGroupSize` (default 4)
 * - If `seedByRating` is true, sorts by rating DESC and snakes across groups
 *   to balance strength. Otherwise, shuffles entrants and deals round-robin.
 */
export function assignGroups(entrants: Entrant[], settings: Settings): GroupTeam[] {
  const n = entrants.length;
  const groupSize = Math.max(2, settings.maxGroupSize ?? 4);
  const nGroups = Math.max(1, Math.ceil(n / groupSize));
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, nGroups).split('');

  let ordered = [...entrants];
  if (settings.seedByRating) {
    ordered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    ordered = shuffle(ordered);
  }

  // Snake seeding: A->B->C ... ->C->B->A ...
  const buckets: Record<string, Entrant[]> = Object.fromEntries(labels.map(l => [l, [] as Entrant[]]));
  let idx = 0;
  let dir = 1;
  for (const e of ordered) {
    const label = labels[idx];
    buckets[label].push(e);
    idx += dir;
    if (idx === labels.length) { dir = -1; idx = Math.max(0, labels.length - 2); }
    else if (idx < 0) { dir = 1; idx = 1; }
  }

  const out: GroupTeam[] = [];
  for (const g of labels) {
    for (const e of buckets[g]) out.push({ entrantId: e.id, group: g });
  }
  return out;
}

// ---------- 2) Generate group fixtures ----------
/**
 * Round-robin scheduler per group using the "circle method".
 * If `doubleRound` is true, creates a second leg with swapped home/away.
 */
export function generateGroupFixtures(groups: GroupTeam[], doubleRound: boolean): Fixture[] {
  const byGroup: Record<string, string[]> = {};
  for (const gt of groups) {
    if (!byGroup[gt.group]) byGroup[gt.group] = [];
    byGroup[gt.group].push(gt.entrantId);
  }

  const fixtures: Fixture[] = [];

  for (const G of Object.keys(byGroup)) {
    const teams = [...byGroup[G]];
    const n = teams.length;
    if (n < 2) continue;

    // If odd number, add a bye (null means no fixture that round for that team)
    const hasBye = n % 2 === 1;
    if (hasBye) teams.push('__BYE__');

    const roundsCount = teams.length - 1; // with bye, still works
    const half = teams.length / 2;
    let ring = teams.slice(1);

    for (let r = 0; r < roundsCount; r++) {
      const roundTeams = [teams[0], ...ring];
      const pairList: [string, string][] = [];
      for (let i = 0; i < half; i++) {
        const home = roundTeams[i];
        const away = roundTeams[roundTeams.length - 1 - i];
        if (home !== '__BYE__' && away !== '__BYE__') pairList.push([home, away]);
      }

      // Leg 1
      for (const [homeId, awayId] of pairList) {
        fixtures.push({
          id: uid(),
          stage: 'groups',
          group_code: G,
          round: r + 1,
          round_label: `Group R${r + 1}`,
          leg: 'single',
          homeId,
          awayId,
          status: 'pending',
        });
      }

      // Leg 2 (reverse), if required
      if (doubleRound) {
        for (const [homeId, awayId] of pairList) {
          fixtures.push({
            id: uid(),
            stage: 'groups',
            group_code: G,
            round: r + 1, // keep same numeric round; UI shows leg
            round_label: `Group R${r + 1} (Leg 2)`,
            leg: 'second',
            homeId: awayId,
            awayId: homeId,
            status: 'pending',
          });
        }
      }

      // rotate ring
      ring = [ring[ring.length - 1], ...ring.slice(0, -1)];
    }
  }

  return fixtures;
}

// ---------- 3) Standings ----------
/**
 * Computes standings from fixtures. Only fixtures with both scores present are counted.
 * Points are determined by settings (win/draw/loss).
 */
export function computeStandings(
  fixtures: Fixture[],
  settings: Settings,
  entrants: Entrant[],
  groups: GroupTeam[]
): Standing[] {
  const W = settings.pointsWin ?? 3;
  const D = settings.pointsDraw ?? 1;
  const L = settings.pointsLoss ?? 0;

  // restrict to entrants that are in a group
  const entrantGroups = new Map<string, string>(); // entrantId -> group letter
  for (const g of groups) entrantGroups.set(g.entrantId, g.group);

  const seed: Record<string, Standing> = {};
  for (const g of groups) {
    seed[g.entrantId] = {
      entrantId: g.entrantId,
      group: g.group,
      won: 0, drawn: 0, lost: 0,
      played: 0,
      gf: 0, ga: 0,
      pts: 0,
    };
  }

  for (const f of fixtures) {
    const home = f.homeId ?? f.home_entrant_id ?? undefined;
    const away = f.awayId ?? f.away_entrant_id ?? undefined;
    const hs = f.home_score;
    const as = f.away_score;

    if (home && away && hs != null && as != null) {
      // ensure both in a group (ignore friendlies/malformed)
      const gHome = entrantGroups.get(home);
      const gAway = entrantGroups.get(away);
      if (!gHome || !gAway) continue;

      const h = seed[home] ?? (seed[home] = { entrantId: home, group: gHome, won: 0, drawn: 0, lost: 0, played: 0, gf: 0, ga: 0, pts: 0 });
      const a = seed[away] ?? (seed[away] = { entrantId: away, group: gAway, won: 0, drawn: 0, lost: 0, played: 0, gf: 0, ga: 0, pts: 0 });

      h.played = (h.played ?? 0) + 1;
      a.played = (a.played ?? 0) + 1;

      h.gf = (h.gf ?? 0) + hs;
      h.ga = (h.ga ?? 0) + as;
      a.gf = (a.gf ?? 0) + as;
      a.ga = (a.ga ?? 0) + hs;

      if (hs > as) { h.won = (h.won ?? 0) + 1; a.lost = (a.lost ?? 0) + 1; h.pts = (h.pts ?? 0) + W; a.pts = (a.pts ?? 0) + L; }
      else if (hs < as) { a.won = (a.won ?? 0) + 1; h.lost = (h.lost ?? 0) + 1; a.pts = (a.pts ?? 0) + W; h.pts = (h.pts ?? 0) + L; }
      else { h.drawn = (h.drawn ?? 0) + 1; a.drawn = (a.drawn ?? 0) + 1; h.pts = (h.pts ?? 0) + D; a.pts = (a.pts ?? 0) + D; }
    }
  }

  return Object.values(seed);
}

/**
 * Returns either:
 * - an array of standings already sorted within groups (group then pos), or
 * - a map { [group]: Standing[] } if you prefer keyed access.
 *
 * To keep compatibility with existing pages, we return a **record** keyed by group.
 */
export function rankWithinGroups(standings: Standing[]): Record<string, Standing[]> {
  const by: Record<string, Standing[]> = {};
  for (const s of standings) {
    if (!by[s.group]) by[s.group] = [];
    by[s.group].push(s);
  }

  const cmp = (a: Standing, b: Standing) => {
    const pa = (a.pts ?? a.points ?? 0);
    const pb = (b.pts ?? b.points ?? 0);
    if (pb !== pa) return pb - pa;
    const gda = (a.gf ?? a.goalsFor ?? 0) - (a.ga ?? a.goalsAgainst ?? 0);
    const gdb = (b.gf ?? b.goalsFor ?? 0) - (b.ga ?? b.goalsAgainst ?? 0);
    if (gdb !== gda) return gdb - gda;
    const gfa = (a.gf ?? a.goalsFor ?? 0);
    const gfb = (b.gf ?? b.goalsFor ?? 0);
    if (gfb !== gfa) return gfb - gfa;
    // fallback deterministic by id
    return (a.entrantId || '').localeCompare(b.entrantId || '');
  };

  for (const k of Object.keys(by)) by[k].sort(cmp);
  return by;
}

// ---------- 4) Knockout (Round of 32) seeding ----------
/**
 * Creates seeded pairs for the Youth Cup Round of 32.
 * Strategy:
 * 1) Take group winners, then runners-up, then best thirds, etc. until 32.
 * 2) Seed 1..32 by points, GD, GF.
 * 3) Pair 1 vs 32, 2 vs 31, ...
 * Returns { seededPairs: [ [id1,id2], ... ] }
 */
export function computeKO32(
  standings: Standing[],
  groups: GroupTeam[],
  _settings: Settings
): { seededPairs: [string, string][] } {
  const by = rankWithinGroups(standings); // { [group]: Standing[] }

  // 1) Collect by finishing position across groups
  const allGroups = Object.keys(by).sort();
  const buckets: Standing[][] = [];
  let pos = 0;
  while (true) {
    let any = false;
    const round: Standing[] = [];
    for (const g of allGroups) {
      const s = by[g][pos];
      if (s) { round.push(s); any = true; }
    }
    if (!any) break;
    buckets.push(round);
    pos++;
  }

  // Flatten in order of positions (1st, then 2nd, then 3rd, ...)
  const candidates: Standing[] = [];
  const cmp = (a: Standing, b: Standing) => {
    const pa = (a.pts ?? a.points ?? 0);
    const pb = (b.pts ?? b.points ?? 0);
    if (pb !== pa) return pb - pa;
    const gda = (a.gf ?? a.goalsFor ?? 0) - (a.ga ?? a.goalsAgainst ?? 0);
    const gdb = (b.gf ?? b.goalsFor ?? 0) - (b.ga ?? b.goalsAgainst ?? 0);
    if (gdb !== gda) return gdb - gda;
    const gfa = (a.gf ?? a.goalsFor ?? 0);
    const gfb = (b.gf ?? b.goalsFor ?? 0);
    if (gfb !== gfa) return gfb - gfa;
    return (a.entrantId || '').localeCompare(b.entrantId || '');
  };
  for (const bucket of buckets) {
    bucket.sort(cmp);
    candidates.push(...bucket);
  }

  const top32 = candidates.slice(0, 32);

  // 2) Seed 1..32 globally
  top32.sort(cmp);

  // 3) Pair 1-32, 2-31, ...
  const pairs: [string, string][] = [];
  const half = Math.floor(top32.length / 2);
  for (let i = 0; i < half; i++) {
    const a = top32[i]?.entrantId;
    const b = top32[top32.length - 1 - i]?.entrantId;
    if (a && b) pairs.push([a, b]);
  }

  return { seededPairs: pairs };
}
```0