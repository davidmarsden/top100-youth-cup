import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { pass } = await req.json().catch(() => ({}));
  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (!ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'ADMIN_KEY not set' }, { status: 500 });
  }
  if (pass !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: 'Invalid passcode' }, { status: 401 });
  }

  cookies().set('yc_admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true });
}