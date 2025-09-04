// src/app/api/fixtures/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Fixture } from "@/lib/types";

/**
 * GET /api/fixtures
 * Loads fixtures from Supabase and maps them to the app's Fixture type.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If Supabase isn’t configured, return an empty list (or change to 500 if you prefer)
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn(
        "[/api/fixtures] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
      return NextResponse.json<Fixture[]>([]);
    }

    // Server-side admin client (never expose service role to the browser)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // "group" is a reserved keyword in SQL, so quote it in the column list
    const { data, error } = await supabase
      .from("fixtures")
      .select(
        'id, season, stage, round, round_label, stage_label, "group", scheduled_at, home_id, away_id, home_goals, away_goals'
      )
      .order("scheduled_at", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("[/api/fixtures] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
    }

    const fixtures: Fixture[] =
      (data ?? []).map((r: any) => ({
        id: String(r.id),
        season: String(r.season),

        // meta
        stage: r.stage ?? null,
        round: r.round ?? null,
        roundLabel: r.round_label ?? null,
        stageLabel: r.stage_label ?? null,
        group: r.group ?? null,

        // scheduling
        scheduledAt:
          r.scheduled_at == null || r.scheduled_at === "" ? null : String(r.scheduled_at),

        // teams (string IDs in app)
        homeId: r.home_id == null ? null : String(r.home_id),
        awayId: r.away_id == null ? null : String(r.away_id),

        // score (numbers or null)
        homeGoals:
          r.home_goals === "" || r.home_goals == null ? null : Number(r.home_goals),
        awayGoals:
          r.away_goals === "" || r.away_goals == null ? null : Number(r.away_goals),
      })) ?? [];

    return NextResponse.json(fixtures);
  } catch (err) {
    console.error("[/api/fixtures] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}