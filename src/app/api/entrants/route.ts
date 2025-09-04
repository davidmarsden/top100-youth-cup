// src/app/api/entrants/route.ts
import { NextResponse } from 'next/server';

// Ensure this is treated as a dynamic route (no prerendering)
export const dynamic = 'force-dynamic';

/**
 * GET /api/entrants
 * Returns a placeholder list (server has no access to browser localStorage).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    entrants: [] as unknown[], // replace with real data when you wire a DB
  });
}

/**
 * POST /api/entrants
 * Accepts { entrants: any[] } and acknowledges receipt.
 * Replace with real persistence later.
 */
export async function POST(req: Request) {
  let entrants: unknown[] = [];
  try {
    const json = await req.json();
    if (json && Array.isArray(json.entrants)) {
      entrants = json.entrants;
    }
  } catch {
    // ignore malformed JSON
  }

  return NextResponse.json({
    ok: true,
    received: entrants.length,
  });
}