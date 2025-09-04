// src/app/api/draw/ping/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from("prize_draws")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return NextResponse.json({ ok: false, error }, { status: 500 });
    return NextResponse.json({ ok: true, count: data?.length ?? 0, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}