// src/lib/types.ts

/** Common ID alias for clarity */
export type Id = string;

/* -------------------------------- Entrants ------------------------------- */

export interface Entrant {
  id: Id;
  /** Season slug/key this entrant belongs to (e.g. "s26") */
  season: string;
  /** Manager/coach name */
  manager: string;
  /** Optional club name shown in the UI */
  club: string | null;
  /** Optional seeding info, e.g. "1", "A", etc. */
  seed: string | null;
}

/* -------------------------------- Settings ------------------------------- */

export interface Settings {
  /**
   * Number of groups in the group stage (used by assignGroups, page.tsx, etc.)
   */
  groupCount: number;

  /**
   * Optional helpers you may add later; kept optional so builds don’t fail.
   */
  teamsPerGroup?: number;
  roundsPerGroup?: number;
}

/* ----------------------------- Group & Tables ---------------------------- */

export interface Standing {
  /** Group label like "A", "B", etc. */
  group: string;

  /** Entrant id this row refers to */
  entrantId: Id;

  // Basic table stats
  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;

  /** Convenience derived value; can be provided or computed in UI */
  goalDiff?: number;

  points: number;

  /** Optional display order if pre-ranked */
  rank?: number;
}

/* -------------------------------- Fixtures ------------------------------- */

export interface Fixture {
  id: Id;
  season: string;

  /** Competition stage slug, e.g. "groups", "youth_cup", "youth_shield" */
  stage: string | null;

  /** Numeric or string round identifier; keep string for flexibility */
  round: string | null;

  /** Optional human labels if provided by data source */
  roundLabel: string | null;
  stageLabel: string | null;

  /** Group label for group-stage matches (e.g., "A") */
  group: string | null;

  /**
   * ISO datetime of kickoff; mapped from source `scheduled_at`.
   * Kept as string for easy rendering/sorting without TZ coercion.
   */
  scheduledAt: string | null;

  /** Team/entrant ids as strings (API mapper coerces nulls to '') */
  homeId: Id;
  awayId: Id;

  /** Scores if played; null if not yet played */
  homeGoals: number | null;
  awayGoals: number | null;
}

/* ----------------------------- Helper Mappings --------------------------- */

/**
 * Minimal shape used by assignGroups helpers if you need it in code.
 * (Kept optional export; safe to remove if unused.)
 */
export interface GroupTeam {
  group: string;
  entrantId: Id;
}
```0