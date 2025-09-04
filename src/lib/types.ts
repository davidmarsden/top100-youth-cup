// src/lib/types.ts

export type Entrant = {
  id: string;
  manager: string;
  club: string;
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
  kickoff: string | null;        // renamed from scheduled_at
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
  group?: string;                // ✅ added so standings can be grouped
};

export type Settings = {
  season: string;
  groupCount: number;
  teamsPerGroup: number;
};