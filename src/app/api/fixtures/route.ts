// src/app/api/fixtures/route.ts
import { NextResponse } from "next/server";
import { sql } from "@neondatabase/serverless";
import type { Fixture } from "@/lib/types";

/**
 * GET /api/fixtures
 * Loads fixtures from the database and maps snake_case columns
 * to the app's camelCase Fixture type.
 */
export async function GET() {
  try {
    const rows = await sql`
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
    `;

    const fixtures: Fixture[] = rows.map((r: any) => ({
      id: String(r.id),
      season: String(r.season),

      // labels / taxonomy
      stage: r.stage ?? null,
      round: r.round ?? null,
      roundLabel: r.round_label ?? null,
      stageLabel: r.stage_label ?? null,
      group: r.group ?? null,

      // datetime (normalized to string|null)
      scheduledAt:
        r.scheduled_at == null || r.scheduled_at === "" ? null : String(r.scheduled_at),

      // teams (force to string|null)
      homeId: r.home_id == null ? null : String(r.home_id),
      awayId: r.away_id == null ? null : String(r.away_id),

      // scores (normalize ''/null to null, else Number)
      homeGoals:
        r.home_goals === "" || r.home_goals == null ? null : Number(r.home_goals),
      awayGoals:
        r.away_goals === "" || r.away_goals == null ? null : Number(r.away_goals),
    }));

    return NextResponse.json(fixtures);
  } catch (err) {
    console.error("Error fetching fixtures:", err);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}