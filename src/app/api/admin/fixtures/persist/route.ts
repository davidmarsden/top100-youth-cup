import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json(); // { season, fixtures }
  const res = await fetch(new URL('/api/fixtures', req.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_KEY || '',   // server-only
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}