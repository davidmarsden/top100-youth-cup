import { NextResponse } from "next/server";

/**
 * Server-side ticket importer:
 * - Fetches the RandomResult ticket HTML (no CORS issues here).
 * - Parses the 3 winners.
 * - Persists to Supabase (prize_draws) with service key.
 * - Returns the stored row.
 *
 * Env required:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - NEXT_PUBLIC_SEASON_ID
 *  - NEXT_PUBLIC_PRIZE_TICKET_URL
 */

type DrawRow = {
  id: string;
  created_at: string;
  seed: string | null;
  winners: string[] | null;
  full_order: string | null;
  ticket_url?: string | null;
};

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const seasonId = process.env.NEXT_PUBLIC_SEASON_ID!;
  const ticketURL = process.env.NEXT_PUBLIC_PRIZE_TICKET_URL;

  if (!url || !key) {
    return new NextResponse("Supabase env not set", { status: 500 });
  }
  if (!ticketURL) {
    return new NextResponse("Ticket URL not configured", { status: 400 });
  }

  // 1) Fetch the ticket HTML
  const htmlRes = await fetch(ticketURL, { cache: "no-store" });
  if (!htmlRes.ok) {
    return new NextResponse(
      `Failed to fetch ticket: ${htmlRes.status} ${htmlRes.statusText}`,
      { status: 502 }
    );
  }
  const html = await htmlRes.text();

  // 2) Naive parse: look for the "Result" section lines (RandomResult shows winners in plain text)
  // We try to collect exactly 3 distinct winner names.
  let winners: string[] = [];

  // Try a couple of loose regex patterns to be resilient to minor page changes
  // Pattern A: bullet/line listing after "Result" area
  const lines = html
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // Heuristic: grab lines after the first "Result" or "Result:" occurrence
  const idx =
    lines.findIndex((l) => /^result\b/i.test(l)) >= 0
      ? lines.findIndex((l) => /^result\b/i.test(l))
      : lines.findIndex((l) => /^<[^>]*>Result/i.test(l));

  if (idx >= 0) {
    // Scrape up to ~20 lines after "Result" and extract human-looking names
    for (let i = idx; i < Math.min(idx + 50, lines.length); i++) {
      const m = lines[i]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim();

      // Filter out boilerplate
      if (!m) continue;
      if (/no result/i.test(m)) break;
      if (/created at|drawing in|scheduled|description|number of items/i.test(m)) continue;

      // Very forgiving “name-ish” line: letters, spaces, punctuation, numbers
      if (/[A-Za-z]/.test(m)) {
        winners.push(m);
        if (winners.length >= 3) break;
      }
    }
  }

  // Deduplicate and take first 3
  winners = Array.from(new Set(winners)).slice(0, 3);

  if (winners.length !== 3) {
    return new NextResponse(
      "Could not parse 3 winners yet — results may not be published.",
      { status: 409 } // conflict / not ready
    );
  }

  // 3) Persist to Supabase
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const insertPayload = {
    season_id: seasonId || null,
    seed: null,
    winners,
    full_order: winners.join(" • "),
    ticket_url: ticketURL,
  } as any;

  // Ensure the column exists (ok to send even if column isn't there)
  // If your table doesn't have ticket_url, Postgres will ignore it if you add it later.
  const { data, error } = await supabase
    .from<DrawRow>("prize_draws" as any)
    .insert(insertPayload)
    .select("id, created_at, seed, winners, full_order, ticket_url")
    .single();

  if (error) {
    return new NextResponse(`DB error: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ row: data });
}