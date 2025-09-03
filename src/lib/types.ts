// src/lib/types.ts

// ---------- Core domain types ----------

export type SeasonCode = string; // e.g. "S26"

export interface Entrant {
  id: string;
  name: string;
  manager?: string | null;
  club?: string | null;
  seed?: number | null;
}

export interface GroupTeam {
  group: string; // e.g. "A", "B", ...
  entrantId: string;
  seed?: number | null;
}

export interface Fixture {
  id: string;
  season: SeasonCode;
  stage: 'groups' | string; // e.g. 'youth_cup', 'youth_shield', etc.
  round?: number | null;
  round_label?: string | null;
  stage_label?: string | null;

  // Participants (camelCase, as used in the app)
  homeId: string;
  awayId: string;

  // Scores (nullable until played)
  homeGoals?: number | null;
  awayGoals?: number | null;

  // Scheduling
  kickoff?: string | null; // ISO string or null
}

// ---------- App/config types ----------

export interface Settings {
  season: SeasonCode;
  timezone: string;

  // Points
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;

  // Grouping rules
  /** Number of groups to form (optional; if omitted, compute from entrants & maxGroupSize) */
  groupCount?: number;
  /** Target maximum teams per group (optional; if omitted, compute from entrants & groupCount) */
  maxGroupSize?: number;

  // Misc
  ageCutoffISO: string; // YYYY-MM-DD
}

export interface KOSeededPairs {
  seededPairs: [string, string][];
}