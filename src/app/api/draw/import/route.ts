// src/app/api/draw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Small helper to return a JSON error with an HTTP status code. */
function fail(
  reason: string,
  status = 500,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { ok: false, reason, ...(extra ?? {}) },
    { status }
  );
}

/**
 * GET /api/draw
 * Returns the latest recorded prize draw row (if any) and a diagnostic block.
 *
 * This route uses the **service role key** so it can read regardless of RLS.
 * If the service key/envs are not present at runtime, the response will include
 * a diagnostic JSON payload so we can pinpoint why Netlify is returning 500s.
 */
export async function GET() {
  // Read envs (don’t log actual secrets).
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Quick preflight diagnostics (no secrets shown).
  const provided = {
    NEXT_PUBLIC_SUPABASE_URL_present: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_present: !!SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!SUPABASE_ANON_KEY,
  };

  // The server **must** have URL + service key. If not, bail with diagnostics.
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return fail("Missing Supabase env vars on server", 500, {
      diag: {
        provided,
        expected: {
          NEXT_PUBLIC_SUPABASE_URL: "required (string)",
          SUPABASE_SERVICE_ROLE_KEY: "required (string) — service role key",
        },
        note:
          "These must be configured in your hosting environment (Netlify) under Site settings → Build & deploy → Environment. " +
          "The service role key is different from the anon key.",
      },
    });
  }

  // Create a service-level client (bypasses RLS).
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { "x-application": "youth-cup/api/draw" } },
  });

  try {
    // Fetch the latest draw row (if any)
    const { data, error } = await supabase
      .from("prize_draws")
      .select("id, created_at, seed, winners, full_order, ticket_url")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Surface supabase error details so we can stop guessing.
      return fail("Supabase select failed", 500, {
        diag: {
          provided,
          supabaseError: {
            message: error.message,
            details: (error as any).details ?? null,
            hint: (error as any).hint ?? null,
            code: (error as any).code ?? null,
          },
          queryShape:
            "select id, created_at, seed, winners, full_order, ticket_url from prize_draws order by created_at desc limit 1",
          tableExpectations: {
            table: "prize_draws",
            columns: [
              "id (uuid or text)",
              "created_at (timestamptz)",
              "seed (text)",
              "winners (jsonb OR text[])",
              "full_order (text, optional)",
              "ticket_url (text, optional)",
            ],
          },
          rlsNote:
            "If you are not using the service role key, RLS must allow read. With the service role key, RLS is bypassed.",
        },
      });
    }

    if (!data) {
      // No rows yet — return empty with helpful instructions.
      return NextResponse.json({
        ok: true,
        row: null,
        diag: {
          provided,
          message:
            "No prize_draws rows found yet. Use the Import flow or insert a row in Supabase.",
        },
      });
    }

    // Happy path
    return NextResponse.json({
      ok: true,
      row: data,
      diag: {
        provided,
        message:
          "Success. Latest row returned. If UI still errors, the problem is in the front-end.",
      },
    });
  } catch (err: any) {
    // Catch any unexpected runtime errors (network, etc.)
    return fail("Unhandled server error while fetching draw", 500, {
      diag: {
        provided,
        runtimeError: {
          message: err?.message ?? String(err),
          name: err?.name ?? null,
          stack: err?.stack ?? null,
        },
      },
    });
  }
}