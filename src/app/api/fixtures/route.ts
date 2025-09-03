import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';
import { isAdminRequest } from '@/server/admin';

// example mapper inside /api/fixtures/route.ts
function toCamelRow(r: any): Fixture {
  return {
    id: r.id,
    season: r.season,
    stage: r.stage,
    round: r.round,
    round_label: r.round_label ?? null,
    stage_label: r.stage_label ?? null,
    group: r.group ?? null,
    scheduled_at: r.scheduled_at ?? null,
    homeId: r.home_id ?? null,
    awayId: r.away_id ?? null,
    homeGoals: r.home_goals ?? null,
    awayGoals: r.away_goals ?? null,
    status: r.status ?? 'scheduled',
    notes: r.notes ?? null,
    double_leg: r.double_leg ?? null,
    leg: r.leg ?? null,
  };
}

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ fixtures: [] });
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season') || 'S26';
  const { data: seasonRow, error: es } = await supabase.from('seasons').select('*').eq('code', season).single();
  if (es || !seasonRow) return NextResponse.json({ fixtures: [] });

  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('season_id', seasonRow.id)
    .order('round_label', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ fixtures: data });
}

/** Bulk upsert fixtures (admin only). Body: { season, fixtures: [...]} */
export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  if (!isAdminRequest(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const code = body.season || 'S26';
  const fixtures = body.fixtures || [];
  const { data: seasonRow, error: es } = await supabase.from('seasons').select('*').eq('code', code).single();
  if (es || !seasonRow) return NextResponse.json({ error: es?.message || 'Season not found' }, { status: 404 });

  const rows = fixtures.map((f: any) => ({
    id: f.id, // allow client-generated ids for stable refs
    season_id: seasonRow.id,
    stage: f.stage,                  // 'groups' | 'youth_cup' | 'youth_shield'
    group_id: f.group_id ?? null,    // optional
    round_label: f.round_label,      // e.g. 'Group R1' or 'Cup QF (Leg 2)'
    leg: f.leg ?? 'single',          // 'single' | 'first' | 'second'
    home_entrant_id: f.homeId ?? f.home_entrant_id ?? null,
    away_entrant_id: f.awayId ?? f.away_entrant_id ?? null,
    scheduled_at: f.scheduled_at ?? null,
    home_score: f.home_score ?? null,
    away_score: f.away_score ?? null,
    status: f.status ?? 'pending',
    notes: f.notes ?? null,
  }));

  const { error } = await supabase.from('fixtures').upsert(rows, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** Admin delete all fixtures for a season */
export async function DELETE(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  if (!isAdminRequest(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('season') || 'S26';
  const { data: seasonRow, error: es } = await supabase.from('seasons').select('*').eq('code', code).single();
  if (es || !seasonRow) return NextResponse.json({ error: es?.message || 'Season not found' }, { status: 404 });

  const { error } = await supabase.from('fixtures').delete().eq('season_id', seasonRow.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}