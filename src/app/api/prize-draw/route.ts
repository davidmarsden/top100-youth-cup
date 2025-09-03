import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');
  if (!season) return NextResponse.json({ error: 'season required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('prize_draws')
    .select('*')
    .eq('season', season)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draw: data ?? null });
}

export async function POST(req: Request) {
  // admin cookie check
  const isAdmin = cookies().get('yc_admin')?.value === '1';
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { season, seed, canonical, full_order, revealed } = body as {
    season: string; seed: string; canonical: string[]; full_order: string[]; revealed: number;
  };
  if (!season || !seed || !Array.isArray(canonical) || !Array.isArray(full_order))
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('prize_draws')
    .upsert(
      { season, seed, canonical, full_order, revealed, updated_at: new Date().toISOString() },
      { onConflict: 'season' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draw: data });
}