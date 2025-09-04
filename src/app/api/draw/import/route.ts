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

  // 2) Try to parse three winners from the “Result” area.
  let winners: string[] = [];
  const lines = html
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const resultIdx =
    lines.findIndex((l) => /^result\b/i.test(l)) >= 0
      ? lines.findIndex((l) => /^result\b/i.test(l))
      : lines.findIndex((l) => /^<[^>]*>Result/i.test(l));

  if (resultIdx >= 0) {
    for (let i = resultIdx; i < Math.min(resultIdx + 50, lines.length); i++) {
      const m = lines[i]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (!m) continue;
      if (/no result/i.test(m)) break;
      if (/created at|drawing in|scheduled|description|number of items/i.test(m)) continue;

      if (/[A-Za-z]/.test(m)) {
        winners.push(m);
        if (winners.length >= 3) break;
      }
    }
  }

  winners = Array.from(new Set(winners)).slice(0, 3);

  if (winners.length !== 3) {
    return new NextResponse(
      "Could not parse 3 winners yet — results may not be published.",
      { status: 409 }
    );
  }

  // 3) Persist to Supabase
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const insertPayload = {
    season_id: seasonId || null,
    seed: null,
    winners, // text[] or jsonb[] is fine; adjust your table type accordingly
    full_order: winners.join(" • "),
    ticket_url: ticketURL,
  } as any;

  // **Important change**: no generic on .from()
  const { data, error } = await supabase
    .from("prize_draws")
    .insert(insertPayload)
    .select("id, created_at, seed, winners, full_order, ticket_url")
    .single();

  if (error) {
    return new NextResponse(`DB error: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ row: data as DrawRow });
}