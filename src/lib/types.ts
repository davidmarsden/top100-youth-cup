// src/lib/types.ts

// Core entities
export type Entrant = {
  id: string;
  season?: string;
  manager: string;
  club: string;
  rating?: number | null;
  created_at?: string;
};

// Fixtures (camelCase in app; mapped to snake_case in DB/API route)
export type Fixture = {
  id: string;
  season: string;
  // 'groups' for group stage, otherwise knockout identifiers e.g. 'youth_cup', 'youth_shield'
  stage: string;
  round?: number | null;         // numeric round for groups (1..n) or KO if used
  round_label?: string | null;   // e.g. 'R16', 'Quarter-final'
  stage_label?: string | null;   // human label for stage if needed
  group?: string | null;         // e.g. 'A', 'B' for group stage
  scheduled_at?: string | null;  // ISO datetime
  homeId: string | null;         // entrant id
  awayId: string | null;         // entrant id
  homeGoals?: number | null;
  awayGoals?: number | null;
  status?: 'scheduled' | 'played' | 'forfeit_home' | 'forfeit_away' | string;
  notes?: string | null;
  // support for home/away legs in KO or double round robin
  double_leg?: boolean | null;
  leg?: 1 | 2 | null;
};

// League table / standings row
export type Standing = {
  teamId: string;   // entrant id
  group: string;    // group label
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

// Group assignment (used by the draw UI)
export type GroupTeam = {
  entrantId: string;
  group: string;           // e.g. 'A'
  position?: number | null;
};

// Global tournament settings
export type Settings = {
  season: string;          // e.g. 'S26'
  ageCutoffISO: string;    // ISO date string
  timezone: string;        // e.g. 'Europe/London'
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  doubleRoundRobin: boolean;
  // draw / grouping constraints
  maxGroupSize: number;
  minGroupSize: number;
};

// Prize draw
export type PrizeEntry = {
  id: string;
  season: string;
  manager: string;
  club: string;
  seed?: number | null;
};

export type PrizeDraw = {
  season: string;
  slots: string[];                // display slots for the theatrical draw
  seededPairs: [string, string][]; // pairs after seeding
  pairs?: [string, string][];      // final randomized pairs if you also persist them
};

// Seeded KO helper (used by /api/fixtures or draw helpers)
export type KOSeeded = {
  season: string;
  slots: string[];
  seededPairs: [string, string][];
};

// Generic API result helpers (optional)
export type ApiError = { error: string };
export type ApiOk = { ok: true };