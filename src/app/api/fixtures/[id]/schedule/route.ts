import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';

export async function POST(req: NextRequest, { params }:{ params: { id: string } }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const { scheduled_at } = await req.json();
  const { error } = await supabase.from('fixtures').update({ scheduled_at }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}