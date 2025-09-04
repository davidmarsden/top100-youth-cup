// src/lib/types.ts

export type Entrant = {
  id: string;
  season: string;            // ✅ added to match /api/entrants/route.ts
  manager: string;
  club: string | null;
  seed?: string | null;      // optional, present in some sources
};

export type GroupTeam = {
  group: string;
  entrantId: string;
};

export type Fixture = {
  id: string;
  season: string;
  round_label: string | null;
  stage_label: string | null;
  group: string | null;
  kickoff: string | null;    // renamed from scheduled_at
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
  group?: string;            // optional grouping key for tables
};

export type Settings = {
  season: string;
  groupCount: number;
  teamsPerGroup: number;
};