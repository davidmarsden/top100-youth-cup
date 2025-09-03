export type Entrant = { id: string; manager: string; club: string; rating?: number };
export type Settings = {
  season: string;
  ageCutoffISO: string;
  timezone: string;
  pointsWin: number; pointsDraw: number; pointsLoss: number;
  maxGroupSize: number;
  bestOfThirdsToFill: boolean;
  doubleRoundRobin?: boolean; // NEW
};
export type GroupTeam = { entrantId: string; group: string; seed?: number };
export type Fixture = {
  id: string; group?: string; round: number;
  homeId: string; awayId: string;
  homeScore?: number; awayScore?: number;
  status: 'pending'|'played'|'forfeit'; notes?: string;
  stage: 'groups'|'knockout'; koLabel?: string;
};
export type Standing = {
  entrantId: string; group: string; played: number; won:number; drawn:number; lost:number;
  gf:number; ga:number; gd:number; pts:number;
};