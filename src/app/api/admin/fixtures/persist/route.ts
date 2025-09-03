import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json(); // { season, fixtures:[...] }
  const url = new URL('/api/fixtures', req.url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_KEY || '',
    },
    body: JSON.stringify(body),
    // Important: ensure this runs server-side only; Next's route handler is server by default
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}