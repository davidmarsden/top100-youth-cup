// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---- Configuration ----
const SEASON = "26"; // Season label for this draw
const ADMIN_KEY = process.env.ADMIN_KEY;

// Optional persistence via Supabase (keys are already in your env)
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase =
  SUPA_URL && SUPA_SERVICE ? createClient(SUPA_URL, SUPA_SERVICE) : null;

// Hard-coded eligible managers (for now). In future, compute from forfeits.
const ELIGIBLE = [
  "Walter Gogh",
  "Heath Brown",
  "Chris Taylor",
  "Gav Harmer",
  "Adam",
  "Bojan",
  "Yamil Mc02",
  "Hugo Costa",
  "James McKenzie",
  "Carl Martin",
  "Ash L",
  "Chris Meida",
  "Dario Saviano",
  "Chris Baggio",
  "Glen Mullan",
  "David Marsden",
  "Regan Thompson",
  "Doug Earle",
  "Marco G",
  "Steven Allington",
  "Dan Wallace",
  "Simon Thomas",
  "Jay Jones (Gladbach, now Monaco)",
  "Ricardo Ferreira",
  "Scott Mckenzie",
  "Paul Masters",
  "Mr TRX",
  "Pedro Vilar",
  "Neil Frankland",
  "Fredrik Johansson (Wolfsburg, now Sporting)",
];

// Utility: crypto-strong, unique sample of n from array (without replacement)
function drawNUnique<T>(source: T[], n: number): T[] {
  if (n > source.length) throw new Error("Sample size > pool");
  const pool = source.slice();
  const out: T[] = [];
  while (out.length < n) {
    const u32 = new Uint32Array(1);
    crypto.getRandomValues(u32);
    const idx = u32[0] % pool.length;
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

// Ensure table exists note: we can't migrate here; but we'll try the upsert/select
// against a `prize_draws` table with columns:
//   season text PRIMARY KEY, winners jsonb, at timestamptz
// If it doesn't exist, GET will just return empty & POST will 500 with a clear message.
async function supaGet() {
  if (!supabase) return { winners: [] as string[], at: null as string | null };
  const { data, error } = await supabase
    .from("prize_draws")
    .select("season,winners,at")
    .eq("season", SEASON)
    .maybeSingle();
  if (error) {
    // Don’t crash builds; surface empty with hint
    return { winners: [] as string[], at: null as string | null };
  }
  return {
    winners: (data?.winners as string[]) || [],
    at: (data?.at as string) || null,
  };
}

async function supaSave(winners: string[], at: string) {
  if (!supabase) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  // Upsert by season
  const { error } = await supabase
    .from("prize_draws")
    .upsert({ season: SEASON, winners, at }, { onConflict: "season" });
  if (error) throw error;
}

// --- GET: public, returns winners (if any) ---
export async function GET() {
  const { winners, at } = await supaGet();
  return NextResponse.json({ season: SEASON, winners, at });
}

// --- POST: admin-only, performs the draw exactly once ---
export async function POST(req: Request) {
  // Verify admin key via header or body
  const body = await req.json().catch(() => ({} as any));
  const provided =
    req.headers.get("x-admin-key") || body?.adminKey || body?.key || "";
  if (ADMIN_KEY && provided !== ADMIN_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Prevent re-draw if already set
  const existing = await supaGet();
  if (existing.winners.length > 0) {
    return new NextResponse("Draw already completed", { status: 409 });
  }

  // Draw exactly 3 winners, persist, return
  const winners = drawNUnique(ELIGIBLE, 3);
  const at = new Date().toISOString();

  await supaSave(winners, at);
  return NextResponse.json({ season: SEASON, winners, at });
}