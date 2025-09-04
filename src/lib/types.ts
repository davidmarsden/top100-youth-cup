// src/lib/types.ts
export interface Entrant {
  id: string;
  manager: string;
  club?: string | null;
  rating?: number | null;
}

export interface GroupTeam {
  group: string;       // "A", "B", ...
  entrantId: string;   // Entrant.id
  manager: string;     // copied from Entrant for easy rendering
  club?: string | null;
}

export interface Fixture {
  id: string;
  group: string;                 // group the fixture belongs to
  homeId: string;                // Entrant.id
  awayId: string;                // Entrant.id
  roundLabel?: string | null;
  stageLabel?: string | null;
  scheduledAt?: string | null;   // ISO or null
  homeGoals?: number | null;
  awayGoals?: number | null;
}

export interface Standing {
  teamId: string;         // Entrant.id
  teamName: string;       // Entrant.manager (optionally + club)
  group: string | null;   // "A" | "B" | ... | null
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Settings {
  season: string;       // display only (no logic needed)
  groupCount: number;   // how many groups to create
}