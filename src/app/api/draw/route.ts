// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Node so we get normal server logs on Netlify
export const runtime = "nodejs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    if (!url || !serviceRole) {
      return NextResponse.json(
        { ok: false, where: "env", message: "Missing Supabase envs" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { "x-application": "yc-draw-api" } },
    });

    // Ask PostgREST to give us exactly these columns
    const { data, error } = await supabase
      .from("prize_draws")
      .select("id,created_at,seed,winners,full_order,ticket_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      // Bubble up the PostgREST error
      return NextResponse.json(
        { ok: false, where: "supabase", message: error.message, details: error.details, hint: error.hint },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    // Last-resort catch
    return NextResponse.json(
      { ok: false, where: "catch", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}