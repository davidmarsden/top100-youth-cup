import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';

export async function GET() {
  if (!supabase) return NextResponse.json({ seasons: [] });
  const { data, error } = await supabase.from('seasons').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ seasons: data });
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const { code, age_cutoff, timezone } = await req.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  // upsert season by code
  const { data, error } = await supabase.from('seasons')
    .upsert({ code, age_cutoff: age_cutoff ?? new Date().toISOString().slice(0,10), timezone: timezone ?? 'Europe/London' }, { onConflict: 'code' })
    .select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ season: data });
}