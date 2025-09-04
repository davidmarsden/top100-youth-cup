// src/app/api/fixtures/route.ts
import { NextResponse } from "next/server";
import type { Fixture } from "@/lib/types";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      // Avoids cryptic failures; build won’t call this, but runtime will get a clear message.
      return NextResponse.json(
        { error: "DATABASE_URL is not configured on the server." },
        { status: 500 }
      );
    }

    const sql = neon(url);

    // NOTE: Neon returns an array of rows (not { rows }).
    const data = (await sql`
      SELECT
        id,
        season,
        stage,
        round,
        round_label,
        stage_label,
        "group",
        scheduled_at,
        home_id,
        away_id,
        home_goals,
        away_goals
      FROM fixtures
      ORDER BY scheduled_at ASC NULLS LAST, id ASC
    `) as any[]; // keep it simple; we normalize below

    const fixtures: Fixture[] = (data ?? []).map((r: any) => ({
      id: String(r.id),
      season: String(r.season),

      // meta
      stage: r.stage ?? null,
      round: r.round ?? null,
      roundLabel: r.round_label ?? null,
      stageLabel: r.stage_label ?? null,
      group: r.group ?? null,

      // time
      scheduledAt: r.scheduled_at ?? null,

      // teams — force to string (empty string if missing)
      homeId: r.home_id != null ? String(r.home_id) : "",
      awayId: r.away_id != null ? String(r.away_id) : "",

      // scores — null if blank/undefined, otherwise number
      homeGoals:
        r.home_goals === "" || r.home_goals == null ? null : Number(r.home_goals),
      awayGoals:
        r.away_goals === "" || r.away_goals == null ? null : Number(r.away_goals),
    }));

    return NextResponse.json({ fixtures });
  } catch (err) {
    console.error("Error fetching fixtures:", err);
    return NextResponse.json(
      { error: "Failed to load fixtures" },
      { status: 500 }
    );
  }
}