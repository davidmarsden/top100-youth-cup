// src/app/api/fixtures/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Fixture } from '@/lib/types';

// Create a server-side Supabase client
function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// DB (snake_case) -> App (camelCase) mapper
function toCamelFixture(r: any): Fixture {
  return {
    id: String(r.id),
    season: String(r.season),
    stage: r.stage ?? null,
    round: r.round ?? null,
    round_label: r.round_label ?? null,
    stage_label: r.stage_label ?? null,
    group: r.group ?? null,                // ✅ included as requested
    scheduledAt: r.scheduled_at ?? null,   // ✅ use scheduledAt (not kickoff)
    homeId: r.home_id != null ? String(r.home_id) : null,
    awayId: r.away_id != null ? String(r.away_id) : null,
    homeGoals:
      r.home_goals === null || r.home_goals === undefined
        ? null
        : Number(r.home_goals),
    awayGoals:
      r.away_goals === null || r.away_goals === undefined
        ? null
        : Number(r.away_goals),
  };
}

// GET /api/fixtures?season=S26 (season optional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get('season');

    const season =
      seasonParam ??
      process.env.NEXT_PUBLIC_DEFAULT_SEASON ??
      process.env.DEFAULT_SEASON ??
      'S26';

    const supabase = supabaseServer();

    // Table expected: fixtures with snake_case columns shown below
    const { data, error } = await supabase
      .from('fixtures')
      .select(
        `
          id,
          season,
          stage,
          round,
          round_label,
          stage_label,
          group,
          scheduled_at,
          home_id,
          away_id,
          home_goals,
          away_goals
        `
      )
      .eq('season', season)
      .order('stage', { ascending: true, nullsFirst: true })
      .order('group', { ascending: true, nullsFirst: true })
      .order('round', { ascending: true, nullsFirst: true })
      .order('scheduled_at', { ascending: true, nullsFirst: true })
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const fixtures: Fixture[] = (data ?? []).map(toCamelFixture);
    return NextResponse.json({ season, fixtures });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}