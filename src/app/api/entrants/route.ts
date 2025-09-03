import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';

async function getSeasonByCode(code: string) {
  const { data, error } = await supabase!.from('seasons').select('*').eq('code', code).single();
  if (error || !data) throw new Error(error?.message || 'Season not found');
  return data;
}

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ entrants: [] }); // local mode
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('season') || 'S26';
  const season = await getSeasonByCode(code);
  const { data, error } = await supabase.from('entrants').select('*').eq('season_id', season.id).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entrants: data });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const body = await req.json(); // { season, manager, club, rating? }
  const code = body.season || 'S26';
  const season = await getSeasonByCode(code);
  const { data, error } = await supabase.from('entrants').insert({
    season_id: season.id,
    manager: body.manager,
    club: body.club,
    rating: body.rating ?? null,
    email: body.email ?? null
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entrant: data });
}

export async function DELETE(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('season') || 'S26';
  const season = await getSeasonByCode(code);
  const { error } = await supabase.from('entrants').delete().eq('season_id', season.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}