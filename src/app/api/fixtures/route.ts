// src/app/api/fixtures/route.ts
import { NextResponse } from 'next/server';
import type { Fixture } from '@/lib/types';

// Map a raw row/object (e.g., from Sheets/DB) into our app's Fixture shape.
// NOTE: our app type uses `kickoff` (not `scheduledAt`).
function toCamelRow(r: any): Fixture {
  return {
    id: String(r.id),
    season: String(r.season),

    // optional stage/round metadata
    stage: r.stage ?? null,
    round: r.round ?? null,
    round_label: r.round_label ?? null,
    stage_label: r.stage_label ?? null,
    group: r.group ?? null,

    // ✅ use `kickoff` to match Fixture type (rename from scheduled_at)
    kickoff: r.scheduled_at ?? null,

    // teams & score (force IDs to string when present)
    homeId: r.home_id != null ? String(r.home_id) : null,
    awayId: r.away_id != null ? String(r.away_id) : null,
    homeGoals:
      r.home_goals === '' || r.home_goals == null
        ? null
        : Number(r.home_goals),
    awayGoals:
      r.away_goals === '' || r.away_goals == null
        ? null
        : Number(r.away_goals),
  };
}

// Minimal GET handler; replace the `rows` source with your actual data fetch.
export async function GET() {
  // TODO: fetch rows from your source (e.g., Google Sheets, DB) and map:
  // const rows = await fetchYourRows();
  const rows: any[] = [];
  const fixtures: Fixture[] = rows.map(toCamelRow);
  return NextResponse.json(fixtures);
}