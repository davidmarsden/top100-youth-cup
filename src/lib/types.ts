// src/lib/types.ts

// --- Basic shared types ---
export type SeasonCode = string;

// --- Settings used across the app (draw, standings, etc.) ---
export interface Settings {
  season: SeasonCode;

  // Competition / table rules
  pointsWin: number;   // e.g. 3
  pointsDraw: number;  // e.g. 1
  pointsLoss: number;  // e.g. 0
  allowDraws: boolean; // e.g. true in group stage, false in KO

  // Group configuration
  maxGroupSize: number; // e.g. 6
  groupCount: number;   // e.g. 8

  // Misc env / formatting
  timezone: string;     // e.g. 'Europe/London'
  ageCutoffISO: string; // e.g. '2024-09-01'
}

// --- Entrants / Teams ---
export interface Entrant {
  id: string;
  name: string;
  manager?: string | null;
  seed?: number | null;
  // Group is optional because many flows assign it later
  group?: string | null;
}

// Team in a named group
export interface GroupTeam {
  entrantId: string;
  group: string; // e.g. 'A', 'B', ...
}

// --- Fixtures (matches) ---
export interface Fixture {
  id: string;

  // Season + stage + round info
  season: SeasonCode;
  stage: 'groups' | string;  // 'groups' or knockout identifiers like 'youth_cup'
  round?: number | null;
  round_label?: string | null;
  stage_label?: string | null;

  // ✅ Added: group label for group-stage fixtures (e.g., 'A', 'B', ...)
  group?: string | null;

  // Scheduling
  kickoff?: string | null;   // ISO string (maps from DB scheduled_at)

  // Participants
  homeId: string;            // entrant id
  awayId: string;            // entrant id

  // Result (nullable until played)
  homeGoals?: number | null;
  awayGoals?: number | null;
}

// --- Group standings row ---
export interface Standing {
  entrantId: string;
  group: string;      // 'A', 'B', etc.
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

// --- Knockout bracket seed data ---
export interface KO {
  // Labelled slots, like "1A", "2C", etc.
  slots: string[];

  // Seeded pairs for R32 draw etc.
  seededPairs: [string, string][];

  // Optional computed pairs list if you also store resolved pairings
  pairs?: [string, string][];
}

// --- Utility map type ---
export type NamedMap<T> = { [key: string]: T };