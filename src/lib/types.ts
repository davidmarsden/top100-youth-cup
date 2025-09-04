// src/lib/types.ts

export type Entrant = {
  id: string;
  season: string;
  manager: string;
  club: string | null;
  seed?: string | null;
};

export type GroupTeam = {
  group: string;
  entrantId: string;
};

export type Fixture = {
  id: string;
  season: string;

  // ✅ added to satisfy /api/fixtures/route.ts
  stage: string | null;                 // e.g., 'groups', 'youth_cup', 'youth_shield'
  round: number | string | null;        // e.g., 1, 2, 3 (or string from source)

  round_label: string | null;
  stage_label: string | null;
  group: string | null;

  kickoff: string | null;               // previously scheduled_at
  homeId: string | null;
  awayId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type Standing = {
  entrantId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  group?: string;                        // optional grouping key
};

export type Settings = {
  season: string;
  groupCount: number;
  teamsPerGroup: number;
};