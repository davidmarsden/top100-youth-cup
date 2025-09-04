// src/app/api/entrants/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Entrant } from '@/lib/types';

// Map DB (snake_case) → API (camelCase)
function toCamelEntrant(r: any): Entrant {
  return {
    id: String(r.id),
    season: String(r.season),
    manager: r.manager ?? '',
    club: r.club ?? null,       // ✅ make sure club is surfaced
    seed: r.seed ?? null,
  };
}

// Create a server-side Supabase client
function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// GET /api/entrants?season=S26  (season is optional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get('season');

    // Fallbacks if no season param supplied
    const season =
      seasonParam ??
      process.env.NEXT_PUBLIC_DEFAULT_SEASON ??
      process.env.DEFAULT_SEASON ??
      'S26';

    const supabase = supabaseServer();

    // Expecting a table like:
    // entrants(id uuid/text, season text, manager text, club text, seed int, ...)
    let query = supabase
      .from('entrants')
      .select(
        `
        id,
        season,
        manager,
        club,
        seed
      `
      )
      .order('seed', { ascending: true, nullsFirst: false })
      .order('manager', { ascending: true });

    // Filter by season if provided/derived
    if (season) {
      query = query.eq('season', season);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const entrants: Entrant[] = (data ?? []).map(toCamelEntrant);

    return NextResponse.json({ season, entrants });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}