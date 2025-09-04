// src/lib/types.ts

// Basic season alias
export type Season = string;

/** Registration / team entry */
export interface Entrant {
  id: string;
  season: Season;
  manager: string;
  club?: string | null;
  seed?: string | null;
  // optional extras you might add later:
  rating?: number | null;
}

/** A match/fixture as used across the app */
export interface Fixture {
  id: string;
  season: Season;

  // competition structure
  stage?: string | null;
  round?: string | null;
  roundLabel?: string | null;
  stageLabel?: string | null;
  group?: string | null;

  // scheduling
  scheduledAt?: string | null; // ISO string or null

  // participants (stored as string ids consistently)
  homeId: string;
  awayId: string;

  // scores (nullable while not played)
  homeGoals?: number | null;
  awayGoals?: number | null;
}

/** Table row for standings */
export interface Standing {
  teamId: string;           // Entrant.id
  group?: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

/** A team placed into a group */
export interface GroupTeam {
  group: string;  // e.g. "A", "B"...
  teamId: string; // Entrant.id
}

/** Tournament settings used by helpers/UI */
export interface Settings {
  /** number of groups to create (e.g., 4) */
  groupCount: number;
  /** teams per group (optional: derive from entrants.length / groupCount) */
  teamsPerGroup?: number;
  /** if true, produce full round-robin fixtures */
  roundRobin?: boolean;
  /** if true, use seeds to distribute entrants across groups */
  seedGroups?: boolean;
}

// (Optionally export a key type used by Entrants component sorting)
export type EntrantSortKey = Extract<keyof Entrant, 'manager' | 'club' | 'seed' | 'rating'>;