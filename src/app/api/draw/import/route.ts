// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type RawRow = {
  id: string;
  created_at?: string | null;
  seed?: string | null;
  // winners might be text[], text, or jsonb depending on how the table was created
  winners?: unknown;
  full_order?: string | null;
  ticket_url?: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be the service role key
  if (!url || !key) {
    throw new Error(
      `Missing Supabase env. url=${!!url}, serviceRole=${!!key}. Check Netlify env vars.`
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Normalize whatever is in "winners" into a string[]
function normalizeWinners(winners: unknown): string[] {
  // Already an array of strings?
  if (Array.isArray(winners)) {
    return (winners as unknown[]).map((v) => String(v));
  }
  // A JSON string?
  if (typeof winners === "string") {
    try {
      const parsed = JSON.parse(winners);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
      // It might be a string like "Alice,Bob,Cara"
      if (parsed && typeof parsed === "object") {
        // unsupported object shape; fall through
      } else {
        const csv = winners.split(",").map((s) => s.trim()).filter(Boolean);
        if (csv.length) return csv;
      }
    } catch {
      // not JSON; try CSV
      const csv = winners.split(",").map((s) => s.trim()).filter(Boolean);
      if (csv.length) return csv;
    }
  }
  // Null, undefined, or anything else
  return [];
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Select only the columns we actually use.
    // If you don’t have ticket_url/full_order yet, Postgres will ignore them.
    const { data, error } = await supabase
      .from<RawRow, RawRow>("prize_draws")
      .select("id,created_at,seed,winners,full_order,ticket_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No prize_draws rows found yet." },
        { status: 404 }
      );
    }

    const row = data[0];
    const winners = normalizeWinners(row.winners);

    return NextResponse.json(
      {
        id: row.id,
        created_at: row.created_at ?? null,
        seed: row.seed ?? null,
        winners,
        full_order: row.full_order ?? null,
        ticket_url: row.ticket_url ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}