// src/lib/tournament.ts
import type { Entrant, Fixture, Settings } from "@/lib/types";

/**
 * Generates fixtures for the tournament.
 *
 * NOTE:
 * - This is a simple, safe placeholder that returns an empty list.
 * - It satisfies the named export so `import { generateFixtures } from "@/lib/tournament"`
 *   works and your build won’t fail.
 * - Replace the body with your real scheduling logic when ready.
 */
export function generateFixtures(
  _entrants: Entrant[] = [],
  _settings?: Settings
): Fixture[] {
  // TODO: implement your real generator (round-robin, knockout, etc.)
  return [];
}