// src/lib/types.ts

export type UUID = string;

export interface Settings {
  season: string;
  ageCutoffISO: string;
  timezone: string;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  maxGroupSize?: number; // used by draw.ts
  doubleRoundRobin?: boolean;
}

export interface Entrant {
  id: UUID;
  season?: string;
  manager: string;
  club: string;
  rating?: number | null;
  created_at?: string;
}

export type Stage = 'groups' | 'youth_cup' | 'youth_shield' | string;

export interface Fixture {
  id: UUID;
  season: string;

  // where in the competition this fixture belongs
  stage: Stage;                 // 'groups', 'youth_cup', 'youth_shield', ...
  round?: number | null;        // numeric round, e.g. 1..6 for groups
  round_label?: string | null;  // human label, e.g. 'Quarter-finals'
  stage_label?: string | null;  // optional friendly label if you store it

  // group play (optional; UI won’t rely on it but leaving for compatibility)
  group?: string | null;        // e.g. 'A', 'B', ...

  // scheduling
  scheduled_at?: string | null; // ISO datetime

  // participants
  homeId: UUID | null;
  awayId: UUID | null;

  // result
  homeGoals?: number | null;    // ✅ camelCase as used by the fixtures page
  awayGoals?: number | null;    // ✅ camelCase as used by the fixtures page

  // misc
  status?: 'scheduled' | 'played' | 'forfeit_home' | 'forfeit_away' | 'abandoned' | string;
  notes?: string | null;

  // two-leg ties (optional)
  double_leg?: boolean | null;
  leg?: number | null;
}

export interface Standing {
  season: string;
  group: string;     // 'A', 'B', ...
  entrantId: UUID;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface KOSeededPairs {
  slots: string[];                 // human labels
  seededPairs: [UUID, UUID][];     // [topSeedId, unseededId]
}