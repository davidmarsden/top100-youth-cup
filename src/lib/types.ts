// src/lib/types.ts

export interface Entrant {
  id: string;
  season: string;
  manager: string;
  club?: string | null;
  seed?: string | null;
}

export interface GroupTeam {
  /** Group label like "A", "B", "1", "2", etc. */
  group: string;
  /** The Entrant.id placed into this group */
  teamId: string;
}

export interface Fixture {
  id: string;
  season: string;
  stage?: string | null;
  round?: string | null;
  roundLabel?: string | null;
  stageLabel?: string | null;
  group?: string | null;

  /** ISO string or null */
  scheduledAt?: string | null;

  homeId: string;
  awayId: string;

  homeGoals?: number | null;
  awayGoals?: number | null;
}

export interface Standing {
  teamId: string;   // Entrant.id
  group: string;    // Group label
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}