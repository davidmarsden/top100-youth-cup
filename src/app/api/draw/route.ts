import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const SEASON_ID = process.env.NEXT_PUBLIC_SEASON_ID!;
const ADMIN_KEY = process.env.ADMIN_KEY!;

/** Hard-coded eligible managers (future: compute from forfeits) */
const ELIGIBLE = [
  "Walter Gogh","Heath Brown","Chris Taylor","Gav Harmer","Adam","Bojan",
  "Yamil Mc02","Hugo Costa","James McKenzie","Carl Martin","Ash L",
  "Chris Meida","Dario Saviano","Chris Baggio","Glen Mullan","David Marsden",
  "Regan Thompson","Doug Earle","Marco G","Steven Allington","Dan Wallace",
  "Simon Thomas","Jay Jones (Gladbach, now Monaco)","Ricardo Ferreira",
  "Scott Mckenzie","Paul Masters","Mr TRX","Pedro Vilar","Neil Frankland",
  "Fredrik Johansson (Wolfsburg, now Sporting)",
] as const;

/** GET: public – fetch latest draw for the season */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("prize_draws")
    .select("winners, seed, created_at")
    .eq("season_id", SEASON_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    winners: data?.winners ?? [],
    seed: data?.seed ?? null,
    at: data?.created_at ?? null,
  });
}

/** POST: admin-only – perform a new draw and persist */
export async function POST(req: Request) {
  const key = req.headers.get("x-admin-key") ?? new URL(req.url).searchParams.get("key");
  if (key !== ADMIN_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { seed } = await req.json().catch(() => ({ seed: null as string | null }));

  // shuffle + pick 3 distinct managers
  const pool = [...ELIGIBLE];
  const rng = seed ? mulberry32(hashString(seed)) : Math.random;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const winners = pool.slice(0, 3);

  const { error } = await supabaseAdmin.from("prize_draws").insert({
    season_id: SEASON_ID,
    seed: seed ?? null,
    winners, // text[]
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ winners });
}

/* ---- utilities ---- */
function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}