// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Hard-coded eligible managers (future: compute via forfeits) */
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

type DrawRow = {
  id: string;
  seed: string | null;
  winners: string[] | null;
  full_order?: string | null;
  created_at?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function pick3(arr: string[], seed?: string) {
  // Fisher–Yates shuffle (optionally seeded for reproducible draws)
  const a = arr.slice();
  let rand = Math.random;
  if (seed) {
    // simple LCG for deterministic shuffle when a seed is supplied
    let s = Array.from(seed).reduce((n, c) => (n * 33 + c.charCodeAt(0)) >>> 0, 2166136261 >>> 0);
    rand = () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return (s & 0xfffffff) / 0xfffffff;
    };
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return { winners: a.slice(0, 3), fullOrder: a.join(" | ") };
}

function extractAdminKey(req: Request, body: any): string | null {
  const h = req.headers;
  const fromHeader =
    h.get("x-admin-key") ||
    h.get("x-admin") ||
    h.get("x-api-key") ||
    h.get("authorization");

  if (fromHeader) {
    const raw = fromHeader.trim();
    if (raw.toLowerCase().startsWith("bearer ")) return raw.slice(7).trim();
    return raw;
  }
  if (body && typeof body.adminKey === "string") return body.adminKey.trim();
  return null;
}

/** GET → return latest winners (public) */
export async function GET() {
  const { data, error } = await supabase
    .from<DrawRow>("prize_draws")
    .select("id, seed, winners, full_order, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const latest = data?.[0];
  return NextResponse.json({
    winners: latest?.winners ?? [],
    created_at: latest?.created_at ?? null,
  });
}

/** POST → run a new draw (admin only) */
export async function POST(req: Request) {
  let body: any = null;
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    // ignore parse errors; body is optional
  }

  const provided = extractAdminKey(req, body);
  const expected = (process.env.ADMIN_KEY || "").trim();

  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfig: ADMIN_KEY is not set." },
      { status: 500 }
    );
  }
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Optional: allow deterministic seed from body
  const seed = typeof body?.seed === "string" ? body.seed : undefined;
  const { winners, fullOrder } = pick3(ELIGIBLE, seed);

  // Persist draw
  const { data, error } = await supabase
    .from("prize_draws")
    .insert([{ seed: seed ?? null, winners, full_order: fullOrder }])
    .select("id, winners, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ winners: data?.winners ?? winners, created_at: data?.created_at });
}