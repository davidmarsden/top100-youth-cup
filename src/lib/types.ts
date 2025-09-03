// src/lib/types.ts

// ---------------------------
// Core app settings & models
// ---------------------------

/**
 * App/tournament settings.
 * NOTE: `season` is optional here and should be supplied at render time
 * via the SeasonProvider hook inside client components.
 */
export type Settings = {
  season?: string;               // e.g. "S26" (runtime via useSeason)
  ageCutoffISO: string;          // YYYY-MM-DD
  timezone: string;              // e.g. "Europe/London"

  pointsWin: number;             // usually 3
  pointsDraw: number;            // usually 1
  pointsLoss: number;            // usually 0

  /** Group stage double round-robin (home & away) */
  doubleRoundRobin?: boolean;
};

export type Entrant = {
  id: string;                    // UUID or local id
  manager: string;
  club: string;
  rating?: number;               // optional average XI rating
};

export type GroupTeam = {
  entrantId: string;             // Entrant.id
  group: string;                 // e.g. 'A', 'B', ...
};

// Keep this broad enough to accept either local or Supabase-backed fields.
export type Fixture = {
  id: string;

  // Season & stage
  season_id?: string;
  stage?: 'groups' | 'youth_cup' | 'youth_shield' | string;

  // Round info
  round?: number;
  round_label?: string;          // e.g. 'Group R1', 'Cup R32'
  leg?: 'single' | 'first' | 'second' | string;

  // Groups
  group_code?: string | null;

  // Teams
  homeId?: string | null;        // local field name
  awayId?: string | null;        // local field name
  home_entrant_id?: string | null; // Supabase schema field
  away_entrant_id?: string | null; // Supabase schema field

  // Schedule/status
  scheduled_at?: string | null;  // ISO datetime
  status?: string;               // 'pending' | 'played' | 'forfeit_home' | ...

  // Scores
  home_score?: number | null;
  away_score?: number | null;

  // Extra
  meta?: any;
};

/**
 * Standing per entrant within a group.
 * Fields are permissive to accommodate different calculators:
 * - some use {won, drawn, lost, gf, ga, pts}
 * - others use short names {w, d, l, goalsFor, goalsAgainst, points}
 */
export type Standing = {
  entrantId: string;
  group: string;

  // Played breakdown
  won?: number;   w?: number;
  drawn?: number; d?: number;
  lost?: number;  l?: number;

  // Totals
  played?: number;

  // Goals
  gf?: number; goalsFor?: number;
  ga?: number; goalsAgainst?: number;

  // Points
  pts?: number; points?: number;
};

// ---------------------------
// Prize draw state
// ---------------------------

export type PrizeDrawState = {
  season: string;                // e.g. "S26"
  seed: string;                  // public seed string
  canonical: string[];           // cleaned unique names as entered
  full_order: string[];          // deterministic shuffled order
  revealed: number;              // how many winners revealed (0..3)
};

// ---------------------------
// API payload helpers
// ---------------------------

export type ApiList<T> = { [key: string]: T[] } | { items: T[] } | T[];

export type ApiError = { error: string };
```0