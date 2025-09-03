// src/lib/types.ts

export type Settings = {
  season?: string;               // runtime via useSeason()
  ageCutoffISO: string;          // YYYY-MM-DD
  timezone: string;

  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;

  /** Group stage double round-robin (home & away) */
  doubleRoundRobin?: boolean;

  /** 👇 NEW: group sizing used by draw.ts */
  maxGroupSize: number;          // e.g. 4 (A–D groups of 4)
  /** Optional helpers some draw funcs might use later */
  minGroupSize?: number;         // default to maxGroupSize if omitted
  groupsPreferredCount?: number; // optional preferred number of groups
  seedByRating?: boolean;        // whether to seed groups by entrant.rating
};

export type Entrant = {
  id: string;
  manager: string;
  club: string;
  rating?: number;
};

export type GroupTeam = {
  entrantId: string;
  group: string; // 'A', 'B', ...
};

export type Fixture = {
  id: string;
  season_id?: string;
  stage?: 'groups' | 'youth_cup' | 'youth_shield' | string;
  round?: number;
  round_label?: string;
  leg?: 'single' | 'first' | 'second' | string;
  group_code?: string | null;

  homeId?: string | null;
  awayId?: string | null;
  home_entrant_id?: string | null;
  away_entrant_id?: string | null;

  scheduled_at?: string | null;
  status?: string;

  home_score?: number | null;
  away_score?: number | null;

  meta?: any;
};

export type Standing = {
  entrantId: string;
  group: string;

  won?: number;   w?: number;
  drawn?: number; d?: number;
  lost?: number;  l?: number;

  played?: number;

  gf?: number; goalsFor?: number;
  ga?: number; goalsAgainst?: number;

  pts?: number; points?: number;
};

export type PrizeDrawState = {
  season: string;
  seed: string;
  canonical: string[];
  full_order: string[];
  revealed: number;
};

export type ApiList<T> = { [key: string]: T[] } | { items: T[] } | T[];
export type ApiError = { error: string };