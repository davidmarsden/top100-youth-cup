// src/lib/types.ts

// An Entrant is a team/club in the tournament
export interface Entrant {
  id: string;
  season: string;
  manager?: string;
  club?: string | null;
  seed?: string | null;
}

// A Fixture is a scheduled match
export interface Fixture {
  id: string;
  season: string;
  stage: string | null;
  round: string | null;
  round_label: string | null;
  stage_label: string | null;
  group: string | null;
  kickoff: string | null; // ✅ replaces scheduledAt
  homeId: string | null;
  awayId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
}

// A Standing is a row in the group table
export interface Standing {
  entrantId: string;
  group: string; // ✅ added so byGroup[...] works
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// A GroupTeam is an Entrant assigned into a group
export interface GroupTeam {
  entrantId: string;
  group: string;
}

// Settings for tournament configuration
export interface Settings {
  season: string;
  groupCount: number;
}