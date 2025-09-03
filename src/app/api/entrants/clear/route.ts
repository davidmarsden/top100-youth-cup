import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { season } = await req.json(); // { season: 'S26' }
  if (!season) return NextResponse.json({ error: 'season required' }, { status: 400 });

  const url = new URL(`/api/entrants?season=${encodeURIComponent(season)}`, req.url);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'x-admin-key': process.env.ADMIN_KEY || '',
    },
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}