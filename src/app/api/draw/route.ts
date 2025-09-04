// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("prize_draws")
      .select("id, created_at, seed, winners, full_order, ticket_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("DRAW API ERROR:", err);
    return NextResponse.json(
      { ok: false, message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}