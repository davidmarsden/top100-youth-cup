import { NextRequest, NextResponse } from 'next/server';
import { appendRows } from '@/server/sheets';

export async function POST(req: NextRequest) {
  try {
    const { sheet, rows } = await req.json(); // { sheet: 'results', rows: [[...], ...] }
    if (!sheet || !rows) return NextResponse.json({ error: 'bad payload' }, { status: 400 });
    await appendRows(sheet, rows);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}