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