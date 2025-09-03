import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';
import { isAdminRequest } from '@/server/admin';

/** Patch a fixture (admin: schedule, notes, override score/status) */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  if (!isAdminRequest(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = params.id;
  const body = await req.json();
  const allowed = ['scheduled_at','home_score','away_score','status','notes','home_entrant_id','away_entrant_id','round_label'];
  const patch: Record<string, any> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const { error } = await supabase.from('fixtures').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}