import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const fixtureId = params.id;
  const body = await req.json(); // { entrant_id, home_score, away_score, flags? }
  const { data: fx, error: e1 } = await supabase.from('fixtures').select('*').eq('id', fixtureId).single();
  if (e1 || !fx) return NextResponse.json({ error: e1?.message || 'No fixture' }, { status: 404 });

  // insert report
  const { error: e2 } = await supabase.from('result_reports').insert({
    fixture_id: fixtureId,
    submitted_by_entrant: body.entrant_id,
    home_score: body.home_score,
    away_score: body.away_score,
    flags: body.flags || {}
  });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });

  // gather all reports for the fixture
  const { data: reports } = await supabase.from('result_reports').select('*').eq('fixture_id', fixtureId).order('created_at', { ascending: true });

  if ((reports?.length ?? 0) >= 2) {
    const a = reports![0], b = reports![1];
    const agree = a.home_score === b.home_score && a.away_score === b.away_score;
    if (agree) {
      await supabase.from('fixtures').update({
        home_score: a.home_score, away_score: a.away_score,
        status: 'confirmed'
      }).eq('id', fixtureId);
    } else {
      await supabase.from('fixtures').update({ status: 'disputed' }).eq('id', fixtureId);
    }
  } else {
    await supabase.from('fixtures').update({ status: 'reported' }).eq('id', fixtureId);
  }

  return NextResponse.json({ ok: true });
}