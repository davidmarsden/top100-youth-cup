// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- Supabase client ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service role for inserts
);

const SEASON_ID = "26"; // hardcoded for now

// Hard-coded eligible managers (later: compute from forfeits)
const ELIGIBLE_MANAGERS = [
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
  "Jay Jones (Monaco)",
  "Ricardo Ferreira",
  "Scott Mckenzie",
  "Paul Masters",
  "Mr TRX",
  "Pedro Vilar",
  "Neil Frankland",
  "Fredrik Johansson",
];

// Fisher–Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- POST /api/draw --- (admin only: run draw)
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shuffled = shuffle(ELIGIBLE_MANAGERS);
  const winners = shuffled.slice(0, 3);

  const { error } = await supabase.from("prize_draws").insert([
    {
      season_id: SEASON_ID,
      seed: Date.now().toString(),
      winners, // text[]
      full_order: shuffled, // optional full shuffle
    },
  ]);

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ winners });
}

// --- GET /api/draw --- (public: latest draw)
export async function GET() {
  const { data, error } = await supabase
    .from("prize_draws")
    .select("winners, created_at")
    .eq("season_id", SEASON_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ winners: data?.winners ?? [] });
}