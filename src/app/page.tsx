"use client";

import { useEffect, useMemo, useState } from "react";

type ApiDrawRow = {
  id: string;
  created_at: string;
  seed: string;
  winners: string[];
  full_order?: string[] | null;
  ticket_url?: string | null;
};

export default function PrizeDrawPage() {
  const [showResults, setShowResults] = useState(false);
  const [revealed, setRevealed] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [latest, setLatest] = useState<ApiDrawRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- Admin panel state (manual entry) ---
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [w3, setW3] = useState("");
  const [ticketUrl, setTicketUrl] = useState("https://www.randomresult.com/ticket.php?t=3995905CGHNZWQT5A");
  const [seed, setSeed] = useState(""); // optional: paste RR ticket hash or a note

  const winners = useMemo(() => latest?.winners ?? [], [latest]);

  // Initial load of current published winners
  useEffect(() => {
    (async () => {
      await refreshLatest();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshLatest() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/draw", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/draw failed: ${res.status}`);
      const payload = await res.json();
      const row: ApiDrawRow | null = payload?.data?.[0] ?? null;
      setLatest(row);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to fetch latest draw");
    } finally {
      setLoading(false);
    }
  }

  function startReveal() {
    setShowResults(true);
    setRevealed([false, false, false]);
    // Staggered reveal: #1 at 0.8s, #2 at 1.8s, #3 at 2.8s
    setTimeout(() => setRevealed(([_, b, c]) => [true, b, c]), 800);
    setTimeout(() => setRevealed(([a, _, c]) => [a, true, c]), 1800);
    setTimeout(() => setRevealed(([a, b, _]) => [a, b, true]), 2800);
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!adminKey.trim()) {
      setErr("Please enter the admin password.");
      return;
    }
    const winners = [w1, w2, w3].map((x) => x.trim()).filter(Boolean);
    if (winners.length !== 3) {
      setErr("Please enter exactly three winners.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/draw/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          winners,
          ticket_url: ticketUrl || null,
          seed: seed || "", // optional
          full_order: winners, // if you have full order later, replace here
        }),
      });
      if (!res.ok) {
        const msg = await safeText(res);
        throw new Error(`Publish failed (${res.status}): ${msg}`);
      }
      const payload = await res.json();
      const row: ApiDrawRow = payload?.data ?? null;
      setLatest(row);
      setAdminOpen(false);
      // Prep the reveal immediately after publish
      setShowResults(false);
      setTimeout(startReveal, 200);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to publish results");
    } finally {
      setLoading(false);
    }
  }

  // Helper: try to read response text safely
  async function safeText(res: Response) {
    try {
      return await res.text();
    } catch {
      return "(no message)";
    }
  }

  const officialTicketUrl = latest?.ticket_url || ticketUrl;

  return (
    <main className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Top 100 — Prize Draw</h1>
        <p className="text-gray-400">Season 26 · Three winners · Publicly viewable</p>
      </header>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.open(officialTicketUrl, "_blank")}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Open official ticket
        </button>
        <button
          onClick={() => { if (!winners?.length) { refreshLatest().then(startReveal); } else { startReveal(); } }}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
          disabled={loading}
        >
          Show results
        </button>
        <button
          onClick={() => setAdminOpen((v) => !v)}
          className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white"
        >
          {adminOpen ? "Close admin" : "Admin: publish winners"}
        </button>
      </div>

      {err && (
        <div className="rounded border border-red-500/40 bg-red-500/10 text-red-200 px-4 py-3">
          {err}
        </div>
      )}

      {/* Winner cards with shimmer + reveal */}
      <section>
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Winners</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WinnerCard index={0} name={winners[0]} revealed={showResults && revealed[0]} />
          <WinnerCard index={1} name={winners[1]} revealed={showResults && revealed[1]} />
          <WinnerCard index={2} name={winners[2]} revealed={showResults && revealed[2]} />
        </div>
        {!winners?.length && (
          <p className="text-gray-400 text-sm mt-3">
            No published winners yet. Use the Admin panel to publish, or click <em>Open official ticket</em>.
          </p>
        )}
      </section>

      {/* Official ticket embed */}
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Official ticket</h2>
        <iframe
          src={officialTicketUrl}
          className="w-full h-[600px] rounded-lg shadow border"
        />
        <p className="text-gray-400 text-sm mt-2">
          Fairness note: the draw is conducted externally by RandomResult. This page stores and reveals the top three winners for Season 26.
        </p>
      </section>

      {/* Admin publish panel */}
      {adminOpen && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">Admin — Publish Results</h2>
          <form className="card p-4 space-y-4" onSubmit={handlePublish}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Admin password</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                  placeholder="Enter admin password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Ticket URL (optional)</label>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                  placeholder="https://www.randomresult.com/ticket.php?..."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Winner #1</label>
                <input
                  value={w1}
                  onChange={(e) => setW1(e.target.value)}
                  className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Winner #2</label>
                <input
                  value={w2}
                  onChange={(e) => setW2(e.target.value)}
                  className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Winner #3</label>
                <input
                  value={w3}
                  onChange={(e) => setW3(e.target.value)}
                  className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                  placeholder="Manager name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Seed / Notes (optional)</label>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full rounded bg-[#0b1220] border border-white/10 px-3 py-2 text-white"
                placeholder="Paste RR hash or short note"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
              >
                {loading ? "Publishing…" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => { setW1(""); setW2(""); setW3(""); setSeed(""); }}
                className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-700 text-white"
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

function WinnerCard({ index, name, revealed }: { index: number; name?: string; revealed: boolean }) {
  return (
    <div
      className={[
        "card p-6 min-h-[110px] flex items-center justify-center text-center transition-all",
        revealed ? "reveal" : "shimmer",
      ].join(" ")}
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
          Winner #{index + 1}
        </p>
        <p className="text-xl font-semibold text-white">
          {revealed ? (name || "—") : "…"}
        </p>
      </div>
    </div>
  );
}