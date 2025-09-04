import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Fixture } from "@/lib/types";

const sql = neon(process.env.DATABASE_URL!);

// Helper: map DB row → Fixture
function toCamelRow(r: any): Fixture {
  return {
    id: String(r.id),
    season: String(r.season),

    // optional metadata
    stage: r.stage ?? null,
    round: r.round ?? null,
    round_label: r.round_label ?? null,
    stage_label: r.stage_label ?? null,
    group: r.group ?? null,

    // datetime (optional)
    scheduledAt: r.scheduled_at ?? null,

    // ⬇️ force IDs to string; never null
    homeId: r.home_id != null ? String(r.home_id) : "",
    awayId: r.away_id != null ? String(r.away_id) : "",

    // scores (nullable → number | null)
    homeGoals:
      r.home_goals === "" || r.home_goals == null ? null : Number(r.home_goals),
    awayGoals:
      r.away_goals === "" || r.away_goals == null ? null : Number(r.away_goals),

    // optional
    venue: r.venue ?? null,
  };
}

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM fixtures`;
    const fixtures: Fixture[] = rows.map(toCamelRow);
    return NextResponse.json(fixtures);
  } catch (err) {
    console.error("Error fetching fixtures:", err);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}