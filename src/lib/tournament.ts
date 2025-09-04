// src/lib/tournament.ts
import type { Entrant, Fixture, Standing, GroupTeam } from "./types";

/**
 * Randomly assign entrants into groups.
 */
export function assignGroups(
  entrants: Entrant[],
  opts: { groupCount: number }
): GroupTeam[] {
  const { groupCount } = opts;

  const shuffled = [...entrants].sort(() => Math.random() - 0.5);
  const groups: GroupTeam[] = [];

  shuffled.forEach((entrant, i) => {
    const groupIndex = i % groupCount;
    groups.push({
      ...entrant,
      group: String.fromCharCode(65 + groupIndex), // A, B, C...
    });
  });

  return groups;
}

/**
 * Generate round-robin fixtures for each group.
 */
export function generateFixtures(groups: GroupTeam[]): Fixture[] {
  const fixtures: Fixture[] = [];
  const grouped: Record<string, GroupTeam[]> = {};

  groups.forEach((g) => {
    if (!grouped[g.group]) grouped[g.group] = [];
    grouped[g.group].push(g);
  });

  let fixtureId = 1;

  Object.entries(grouped).forEach(([group, teams]) => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: `fx-${fixtureId++}`,
          season: "current", // you can swap in useSeason() at runtime
          stage: "group",
          round: null,
          roundLabel: null,
          stageLabel: `Group ${group}`,
          group,
          kickoff: null,
          homeId: teams[i].id,
          awayId: teams[j].id,
          homeGoals: null,
          awayGoals: null,
        });
      }
    }
  });

  return fixtures;
}

/**
 * Calculate standings from fixtures.
 */
export function calculateStandings(
  groups: GroupTeam[],
  fixtures: Fixture[]
): Standing[] {
  const standings: Standing[] = groups.map((g) => ({
    id: g.id,
    season: g.season,
    group: g.group ?? "",
    teamId: g.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));

  const map = Object.fromEntries(standings.map((s) => [s.teamId, s]));

  fixtures.forEach((fx) => {
    if (fx.homeGoals == null || fx.awayGoals == null) return;

    const home = map[fx.homeId];
    const away = map[fx.awayId];

    if (!home || !away) return;

    home.played++;
    away.played++;
    home.goalsFor += fx.homeGoals;
    home.goalsAgainst += fx.awayGoals;
    away.goalsFor += fx.awayGoals;
    away.goalsAgainst += fx.homeGoals;

    if (fx.homeGoals > fx.awayGoals) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (fx.homeGoals < fx.awayGoals) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  });

  return standings.sort((a, b) => b.points - a.points);
}