// src/lib/defaults.ts
import type { Settings } from '@/lib/types';

// If you have a real season hook/context, wire it up at runtime in components.
// Defaults are only used as a baseline (and are SSR-safe).
const DEFAULT_SEASON = 'S26'; // harmless placeholder for build-time defaults

export const defaultSettings: Settings = {
  season: DEFAULT_SEASON,
  timezone: 'Europe/London',

  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,

  // Provide BOTH so either strategy works (some code paths read groupCount,
  // others read maxGroupSize). Adjust to your tournament shape.
  groupCount: 8,     // e.g., 8 groups (A–H)
  maxGroupSize: 4,   // e.g., 4 teams per group

  ageCutoffISO: new Date().toISOString().slice(0, 10),
};