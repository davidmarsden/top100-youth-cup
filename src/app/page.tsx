"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DrawRow = {
  id: string;
  created_at: string;
  seed: string | null;
  winners: string[] | null;
  full_order: string | null;
  ticket_url?: string | null;
};

const CARD_BASE =
  "rounded-2xl border bg-white shadow-sm p-8 flex items-center justify-center text-2xl font-semibold min-h-[140px] sm:min-h-[160px] md:min-h-[180px]";

export default function PrizeDrawPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [row, setRow] = useState<DrawRow | null>(null);
  const [reveal, setReveal] = useState(false);

  // Ticket URL is baked in via env; page still works if it’s not set (button disabled).
  const ticketUrl = process.env.NEXT_PUBLIC_PRIZE_TICKET_URL || "";

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/draw", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/draw failed: ${res.status}`);
      const json = (await res.json()) as { row: DrawRow | null };
      setRow(json.row);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load draw.");
    } finally {
      setLoading(false);
    }
  }

  // Import from RandomResult ticket (server fetch → Supabase write → return latest row)
  async function importFromTicket() {
    setErr(null);
    setLoading(true);
    setReveal(false);
    try {
      const res = await fetch("/api/draw/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(
          `Import failed (${res.status})${
            msg ? `: ${msg}` : " — results probably not ready yet."
          }`
        );
      }
      const json = (await res.json()) as { row: DrawRow | null };
      setRow(json.row);
      // If winners exist now, allow the reveal
      if (json.row?.winners?.length) setReveal(true);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to import results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load any saved winners on first visit
    refresh();
  }, []);

  const winners = useMemo(() => row?.winners ?? [], [row]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Prize Draw</h1>
        <p className="text-gray-600">Season 26 · Three winners · Publicly viewable</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={refresh}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          disabled={loading}
        >
          Refresh
        </button>

        <a
          href={ticketUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 ${
            ticketUrl ? "" : "pointer-events-none opacity-50"
          }`}
          title={ticketUrl ? "Open official RandomResult ticket" : "Ticket URL not set"}
        >
          Open official ticket
        </a>

        <button
          onClick={importFromTicket}
          className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
          title="Fetch results from the ticket and store them"
        >
          Import results
        </button>

        <button
          onClick={() => setReveal(true)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={!winners.length || loading}
          title={winners.length ? "Reveal with a bit of theatre" : "No stored winners yet"}
        >
          Show results
        </button>
      </div>

      {err && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Winners theatre */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        {[0, 1, 2].map((i) => {
          const name = winners[i] || null;
          return (
            <div
              key={i}
              className={`${CARD_BASE} relative overflow-hidden`}
              style={{
                perspective: "1000px",
              }}
            >
              <div
                className={`transition-transform duration-[1200ms] ease-out ${
                  reveal && name ? "rotate-y-0" : "rotate-y-180"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {/* Front (hidden) */}
                <div
                  className="absolute inset-0 backface-hidden flex items-center justify-center text-gray-300"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  Winner #{i + 1}
                </div>
                {/* Back (revealed) */}
                <div className="absolute inset-0 backface-hidden flex items-center justify-center">
                  {name ? (
                    <span className="text-2xl md:text-3xl">{name}</span>
                  ) : (
                    <span className="text-gray-400">Winner #{i + 1}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Ticket embed (optional, purely to view) */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Official ticket</h2>
        {ticketUrl ? (
          <iframe
            src={ticketUrl}
            className="w-full rounded-xl border min-h-[480px]"
            title="RandomResult Ticket"
          />
        ) : (
          <p className="text-sm text-gray-600">
            Ticket URL not configured. Add <code>NEXT_PUBLIC_PRIZE_TICKET_URL</code> to your
            environment.
          </p>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Fairness note: the draw is conducted externally by RandomResult. This page only displays
        and archives the outcome (top three) for Season 26.
      </p>
    </main>
  );
}