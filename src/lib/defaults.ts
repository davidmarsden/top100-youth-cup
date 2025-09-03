// src/lib/defaults.ts
import { Settings } from './types';

// NOTE: Do not use React hooks here. This file is imported at build/runtime on the server too.
export const defaultSettings: Settings = {
  // season is resolved at render time via useSeason(); keep it out of defaults
  ageCutoffISO: new Date().toISOString().slice(0, 10),
  timezone: 'Europe/London',
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  doubleRoundRobin: false,
};