// src/app/api/draw/import/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export type RawRow = {
  id: string;
  created_at: string | null;
  seed: string | null;
  winners: unknown | null;   // jsonb (array of 3 names)
  full_order: string | null; // optional long list as text
  ticket_url: string | null; // official ticket URL
};

type ImportPayload = {
  adminKey?: string;
  winners: string[];
  fullOrder?: string;
  seed?: string;
  ticketUrl?: string;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    throw new Error("Supabase env not set (URL or SERVICE_ROLE_KEY missing).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ImportPayload;

    const headerKey = req.headers.get("x-admin-key") ?? undefined;
    const providedKey = body.adminKey ?? headerKey ?? "";
    const adminKey = process.env.ADMIN_KEY ?? "";

    if (!adminKey) return fail("Server missing ADMIN_KEY env var.", 500);
    if (providedKey !== adminKey) return fail("Invalid admin key.", 401);

    if (!Array.isArray(body.winners) || body.winners.length === 0) {
      return fail("Payload must include 'winners' (array).");
    }

    const insertPayload = {
      seed: body.seed ?? null,
      winners: body.winners,          // jsonb
      full_order: body.fullOrder ?? null,
      ticket_url: body.ticketUrl ?? null,
    };

    const supabase = getSupabaseAdmin();

    // IMPORTANT: no generics on .from — avoids the “expected 2 type arguments” error
    const { data, error } = await supabase
      .from("prize_draws")
      .insert(insertPayload)
      .select("id, created_at, seed, winners, full_order, ticket_url")
      .single();

    if (error) return fail(`Insert failed: ${error.message}`, 500);

    const row = data as RawRow;
    return ok(row);
  } catch (err: any) {
    return fail(err?.message ?? "Unexpected error.", 500);
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("prize_draws")
      .select("id, created_at, seed, winners, full_order, ticket_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return fail(`Fetch failed: ${error.message}`, 500);
    if (!data || data.length === 0) return ok(null);

    const row = data[0] as RawRow;
    return ok(row);
  } catch (err: any) {
    return fail(err?.message ?? "Unexpected error.", 500);
  }
}