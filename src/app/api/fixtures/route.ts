// src/app/api/fixtures/route.ts
import { NextResponse } from "next/server";
import type { Fixture } from "@/lib/types";
import { neon } from "@neondatabase/serverless";

/**
 * GET /api/fixtures
 * Returns all fixtures from the database, mapped into Fixture type
 */
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const { rows: data } = await sql`
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
    `;

    const fixtures: Fixture[] = (data ?? []).map((r: any) => ({
      id: String(r.id),
      season: String(r.season),

      // labels/meta
      stage: r.stage ?? null,
      round: r.round ?? null,
      roundLabel: r.round_label ?? null,
      stageLabel: r.stage_label ?? null,
      group: r.group ?? null,

      // time
      scheduledAt: r.scheduled_at ?? null,

      // teams — force to string
      homeId: r.home_id != null ? String(r.home_id) : "",
      awayId: r.away_id != null ? String(r.away_id) : "",

      // scores
      homeGoals:
        r.home_goals === "" || r.home_goals == null ? null : Number(r.home_goals),
      awayGoals:
        r.away_goals === "" || r.away_goals == null ? null : Number(r.away_goals),
    }));

    return NextResponse.json({ fixtures });
  } catch (err: any) {
    console.error("Error fetching fixtures:", err);
    return NextResponse.json(
      { error: "Failed to load fixtures" },
      { status: 500 }
    );
  }
}