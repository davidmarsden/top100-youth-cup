// Central, minimal types we actually use on the homepage

export type Entrant = {
  id: string;
  manager: string;
  club?: string | null;
};

export type GroupKey = string; // e.g. "A", "B" ...
export type GroupsByKey = Record<GroupKey, Entrant[]>;

export type Fixture = {
  id: string;
  group: GroupKey | null;
  round: number | null;
  scheduledAt: string | null; // ISO
  homeId: string;
  awayId: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
};

export type Standing = {
  teamId: string;
  group: GroupKey | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export type Settings = {
  groupCount: number;
};