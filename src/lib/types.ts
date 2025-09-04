export interface Entrant {
  id: string;               // unique identifier
  season: string;           // season code (e.g. "S26")
  manager?: string;         // manager name (optional)
  club?: string | null;     // club name (optional)
  seed?: string | null;     // seed info (optional)
}

export interface Fixture {
  id: string;               // unique fixture id
  season: string;           // season code
  stage?: string | null;    // stage of tournament (e.g. "Group", "Quarter")
  round?: string | null;    // round number / label
  round_label?: string | null;
  stage_label?: string | null;
  group?: string | null;    // group letter (A, B, C…)
  scheduledAt?: string | null; // ISO string for kickoff time
  homeId: string;           // entrantId of home team
  awayId: string;           // entrantId of away team
  homeGoals?: number | null;
  awayGoals?: number | null;
}

export interface Standing {
  entrantId: string;        // links back to Entrant.id
  group: string;            // group letter
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Settings {
  groupCount: number;       // number of groups
  teamsPerGroup: number;    // teams in each group
  advancePerGroup: number;  // number of teams advancing per group
}