import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabaseAdmin'; // service key client (server-only)

export async function GET() {
  // Strategy: "most recently updated season" wins; fallback to "most recently created"
  const { data, error } = await supabaseAdmin
    .from('seasons')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'no seasons' }, { status: 404 });

  return NextResponse.json({ season: data });
}