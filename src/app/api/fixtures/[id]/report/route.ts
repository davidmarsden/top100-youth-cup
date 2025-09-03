import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';

/** Public: Managers self-report score / flags. Confirms on second matching report, else marks disputed. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  const fixture_id = params.id;
  const body = await req.json(); // { entrant_id, home_score, away_score, flags? }

  // 1) store report
  const { error: e1 } = await supabase.from('result_reports').insert({
    fixture_id,
    submitted_by_entrant: body.entrant_id ?? null,
    home_score: body.home_score,
    away_score: body.away_score,
    flags: body.flags || {},
  });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  // 2) read reports for fixture
  const { data: reports } = await supabase
    .from('result_reports')
    .select('*')
    .eq('fixture_id', fixture_id)
    .order('created_at', { ascending: true });

  // 3) confirm/dispute
  if ((reports?.length ?? 0) >= 2) {
    const a = reports![0], b = reports![1];
    const agree = a.home_score === b.home_score && a.away_score === b.away_score;
    if (agree) {
      await supabase.from('fixtures').update({
        home_score: a.home_score,
        away_score: a.away_score,
        status: 'confirmed',
      }).eq('id', fixture_id);
    } else {
      await supabase.from('fixtures').update({ status: 'disputed' }).eq('id', fixture_id);
    }
  } else {
    await supabase.from('fixtures').update({ status: 'reported' }).eq('id', fixture_id);
  }

  return NextResponse.json({ ok: true });
}