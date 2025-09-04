// src/lib/types.ts

// ──────────────────────────────────────────────────────────────────────────────
// Core domain types used across the app
// ──────────────────────────────────────────────────────────────────────────────

export interface Entrant {
  id: string;
  season: string;
  manager: string;
  club?: string | null;
  seed?: string | null;
}

export interface Fixture {
  id: string;
  season: string;
  stage: string | null;
  round: string | null;
  roundLabel: string | null;   // ← camelCase (maps from DB round_label)
  stageLabel: string | null;   // ← camelCase (maps from DB stage_label)
  group: string | null;
  scheduledAt: string | null;  // ← camelCase (maps from DB scheduled_at)
  homeId: string | null;       // ← camelCase (maps from DB home_id)
  awayId: string | null;       // ← camelCase (maps from DB away_id)
  homeGoals: number | null;    // ← camelCase (maps from DB home_goals)
  awayGoals: number | null;    // ← camelCase (maps from DB away_goals)
}

export interface GroupTeam {
  group: string;        // e.g. "A", "B", ...
  entrantId: string;    // Entrant.id assigned to the group
}

export interface Standing {
  entrantId: string;    // links a row to an Entrant
  group: string;        // group this entrant belongs to
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface Settings {
  groupCount: number;     // how many groups
  teamsPerGroup: number;  // teams in each group
  legsPerFixture: number; // 1 or 2 legs
  pointsForWin: number;   // usually 3
  pointsForDraw: number;  // usually 1
  pointsForLoss: number;  // usually 0
}