export interface Fixture {
  id: string;
  season: SeasonCode;
  stage: 'groups' | string;
  round?: number | null;
  round_label?: string | null;
  stage_label?: string | null;

  // Add this line 👇
  group?: string | null;

  homeId: string;
  awayId: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  kickoff?: string | null;
}