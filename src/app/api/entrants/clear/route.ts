// src/app/api/entrants/clear/route.ts
import { NextResponse } from 'next/server';

// Force dynamic so Netlify/Next won’t try to prerender this file.
export const dynamic = 'force-dynamic';

/**
 * Clear entrants endpoint.
 * Server cannot clear browser localStorage; this is an acknowledgement endpoint.
 * Your client should clear localStorage after a successful call.
 */
export async function POST() {
  return NextResponse.json({ ok: true, action: 'clear-entrants' });
}

// Optional: also support DELETE
export async function DELETE() {
  return NextResponse.json({ ok: true, action: 'clear-entrants' });
}