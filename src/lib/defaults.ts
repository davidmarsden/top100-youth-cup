// src/lib/defaults.ts
import { Settings } from './types';

// No React hooks here – server-safe defaults.
export const defaultSettings: Settings = {
  ageCutoffISO: new Date().toISOString().slice(0, 10),
  timezone: 'Europe/London',
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  doubleRoundRobin: false,

  // 👇 NEW: keep groups of 4 by default
  maxGroupSize: 4,
  // Optional extras (safe defaults)
  minGroupSize: 4,
  groupsPreferredCount: undefined,
  seedByRating: true,
};