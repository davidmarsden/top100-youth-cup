// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  created_at: string | null;
  seed: string | null;
  winners: unknown | null;   // jsonb (array of names)
  full_order: string | null; // long text list (optional)
  ticket_url: string | null; // official ticket URL (optional)
};

function getSupabaseForServerReads() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !service) {
    const problems = {
      hasUrl: Boolean(url),
      hasServiceRole: Boolean(service),
      // NOTE: we never expose actual values; just booleans.
    };
    throw new Error(
      `Supabase env missing. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ${JSON.stringify(
        problems
      )}`
    );
  }
  // Use the service role on the server so we can read even if RLS blocks anon.
  return createClient(url, service, { auth: { persistSession: false } });
}

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
function fail(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function GET() {
  try {
    const supabase = getSupabaseForServerReads();

    // No generics on .from — avoids TS “expected 2 type arguments” issues.
    const { data, error } = await supabase
      .from("prize_draws")
      .select("id, created_at, seed, winners, full_order, ticket_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      // Typical failure here (when using anon) is RLS/permission denied.
      // With service role it should not happen, but we surface details if it does.
      return fail(`Supabase select failed: ${error.message}`, 500, {
        code: (error as any)?.code ?? null,
        hint: (error as any)?.hint ?? null,
      });
    }

    if (!data || data.length === 0) {
      // Clean “no content yet” response (still 200)
      return ok<Row | null>(null);
    }

    const latest = data[0] as Row;
    return ok<Row>(latest);
  } catch (err: any) {
    return fail(err?.message ?? "Unexpected server error.", 500);
  }
}