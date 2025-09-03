// src/app/api/fixtures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Fixture } from '@/lib/types';

// --- Supabase (server) client ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// --- Admin check (server-side header injected by /admin actions) ---
function isAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key && process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

// --- Mappers: DB (snake_case) <-> API (camelCase) ---
function toCamelRow(r: any): Fixture {
  return {
    id: r.id,
    season: r.season,
    stage: r.stage,
    round: r.round ?? null,
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

function toSnakeRow(fx: Partial<Fixture>) {
  return {
    id: fx.id,
    season: fx.season,
    stage: fx.stage,
    round: fx.round ?? null,
    round_label: fx.round_label ?? null,
    stage_label: fx.stage_label ?? null,
    group: fx.group ?? null,
    scheduled_at: fx.scheduled_at ?? null,
    home_id: fx.homeId ?? null,
    away_id: fx.awayId ?? null,
    home_goals: fx.homeGoals ?? null,
    away_goals: fx.awayGoals ?? null,
    status: fx.status ?? null,
    notes: fx.notes ?? null,
    double_leg: fx.double_leg ?? null,
    leg: fx.leg ?? null,
  };
}

// --- Helpers ---
function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

// GET /api/fixtures?season=Sxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');
  if (!season) return bad('Missing season');

  const { data, error } = await sb
    .from('fixtures')
    .select('*')
    .eq('season', season)
    .order('stage', { ascending: true })
    .order('round', { ascending: true })
    .order('group', { ascending: true });

  if (error) return bad(error.message, 500);

  const rows = (data ?? []).map(toCamelRow);
  return NextResponse.json(rows, { status: 200 });
}

// POST /api/fixtures  (admin)
// body: Fixture (or Partial<Fixture> with required fields)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return bad('Unauthorized', 401);

  const body = (await req.json()) as Partial<Fixture>;
  if (!body?.season || !body?.stage)
    return bad('Missing required fields: season, stage');

  const toInsert = toSnakeRow(body);

  const { data, error } = await sb.from('fixtures').insert(toInsert).select('*').single();
  if (error) return bad(error.message, 500);

  return NextResponse.json(toCamelRow(data), { status: 201 });
}

// PATCH /api/fixtures  (admin)
// body: { id: string, ...fieldsToUpdate }
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return bad('Unauthorized', 401);

  const body = (await req.json()) as Partial<Fixture>;
  if (!body?.id) return bad('Missing id');

  const updates = toSnakeRow(body);
  // ensure we don't try to update undefined keys
  Object.keys(updates).forEach((k) => {
    if (updates[k as keyof typeof updates] === undefined) {
      delete (updates as any)[k];
    }
  });

  const { data, error } = await sb
    .from('fixtures')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) return bad(error.message, 500);

  return NextResponse.json(toCamelRow(data), { status: 200 });
}

// DELETE /api/fixtures?season=Sxx  (admin) — purge a season’s fixtures
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return bad('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');
  if (!season) return bad('Missing season');

  const { error } = await sb.from('fixtures').delete().eq('season', season);
  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Next.js route options (API routes don’t use page revalidate; avoid ISR config here)
export const runtime = 'nodejs';