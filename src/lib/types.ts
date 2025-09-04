// src/lib/types.ts

// Entrants in the tournament (clubs/managers that register)
export type Entrant = {
  id: string;
  season: string;
  manager: string;
  club?: string | null;       // ✅ club name added
  seed?: number | null;
};

// A fixture (match) in the tournament
export type Fixture = {
  id: string;
  season: string;
  stage: 'groups' | 'youth_cup' | 'youth_shield' | string;
  round: number | null;
  round_label?: string | null;
  stage_label?: string | null;
  group?: string | null;          // ✅ added group support
  scheduledAt?: string | null;    // ✅ camelCase field for match datetime
  homeId: string | null;
  awayId: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
};

// Grouped team (entrants inside a group)
export type GroupTeam = {
  group: string;
  entrantId: string;
};

// A standing in a group table
export type Standing = {
  entrantId: string;   // ✅ now matches how you search in page.tsx
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

// General tournament settings
export type Settings = {
  season: string;
  groupCount: number;   // ✅ added so assignGroups works
};

// Draw entries (for random prize draw)
export type DrawEntry = {
  id: string;
  entrantId: string;
  createdAt: string;
};

// Saved draw result (for persistence + theatrical draw)
export type DrawResult = {
  id: string;
  entrantId: string;
  createdAt: string;
  winner: boolean;
};