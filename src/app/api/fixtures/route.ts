// src/app/api/fixtures/route.ts
import { NextResponse } from 'next/server';
import type { Fixture } from '@/lib/types';

// Map a DB row (snake_case) to our app Fixture (camelCase)
function toCamelRow(r: any): Fixture {
  return {
    id: String(r.id),
    season: String(r.season),
    stage: (r.stage ?? 'groups') as string,
    round: r.round ?? null,
    round_label: r.round_label ?? null,
    stage_label: r.stage_label ?? null,

    // ✅ this exists on Fixture
    group: r.group ?? null,

    // ✅ rename scheduled_at → kickoff on the app type
    kickoff: r.scheduled_at ?? null,

    // Ensure strings (Fixture.homeId/awayId are strings in the app)
    homeId: String(r.home_id ?? ''),
    awayId: String(r.away_id ?? ''),

    // nullable scores are fine
    homeGoals: r.home_goals ?? null,
    awayGoals: r.away_goals ?? null,
  };
}

// If you already fetch real rows, replace the stub below with your query and map with toCamelRow(row)
export async function GET() {
  // Example placeholder; replace with your real data source:
  const rows: any[] = []; // e.g., await db.select('*').from('fixtures').where(...)

  const fixtures = rows.map(toCamelRow);
  return NextResponse.json({ fixtures });
}