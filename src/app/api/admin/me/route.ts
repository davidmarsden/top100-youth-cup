import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const admin = cookies().get('yc_admin')?.value === '1';
  return NextResponse.json({ admin });
}