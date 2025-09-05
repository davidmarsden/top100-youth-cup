// src/app/draw/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type DrawRow = {
  id: string;
  created_at: string;
  seed: string;
  winners: string[];
  full_order: string[] | null;
  ticket_url: string | null;
};

const ADMIN_HEADER = "X-Admin-Key";

export default function DrawAdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [ticketUrl, setTicketUrl] = useState("");
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [w3, setW3] = useState("");
  const [loading, setLoading] = useState(false);

  // show latest saved draw (public view)
  const [latest, setLatest] = useState<DrawRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/draw");
        if (r.ok) {
          const j = await r.json();
          setLatest(j.data ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // simple admin gate prompt
  const ensureAdmin = async () => {
    if (isAdmin) return true;
    const pwd = window.prompt("Admin password:");
    if (!pwd) return false;
    // quick ping (HEAD) to validate
    const ok = await fetch("/api/draw", { method: "HEAD", headers: { [ADMIN_HEADER]: pwd } })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) {
      toast.error("Invalid admin password");
      return false;
    }
    localStorage.setItem("yc:adminKey", pwd);
    setIsAdmin(true);
    toast.success("Admin unlocked");
    return true;
  };

  // restore admin if they previously entered it
  useEffect(() => {
    const saved = localStorage.getItem("yc:adminKey");
    if (!saved) return setChecking(false);
    (async () => {
      const ok = await fetch("/api/draw", { method: "HEAD", headers: { [ADMIN_HEADER]: saved } })
        .then((r) => r.ok)
        .catch(() => false);
      if (ok) setIsAdmin(true);
      setChecking(false);
    })();
  }, []);

  async function autofillFromTicket() {
    if (!ticketUrl) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/draw/scrape?url=${encodeURIComponent(ticketUrl)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Scrape failed");
      const winners: string[] = j.winners ?? [];
      setW1(winners[0] ?? "");
      setW2(winners[1] ?? "");
      setW3(winners[2] ?? "");
      toast.success("Autofilled winners from ticket");
    } catch (e: any) {
      toast.error(e.message ?? "Autofill failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveWinners() {
    if (!(await ensureAdmin())) return;
    const adminKey = localStorage.getItem("yc:adminKey") ?? "";
    const winners = [w1, w2, w3].map((x) => x.trim()).filter(Boolean);
    if (winners.length !== 3) {
      toast.error("Please provide exactly three winners");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/draw/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_HEADER]: adminKey },
        body: JSON.stringify({
          ticket_url: ticketUrl || null,
          winners,
          // you can optionally include full_order later
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setLatest(j.data);
      toast.success("Winners saved");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const publicWinners = useMemo(() => latest?.winners ?? [], [latest]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Prize Draw — Admin</h1>

      <section className="card p-4 space-y-4">
        <label className="block">
          <span className="block text-sm text-slate-300">Ticket URL (RandomResult share link)</span>
          <input
            className="mt-1 w-full rounded-md bg-slate-900 px-3 py-2 ring-1 ring-slate-700"
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            placeholder="https://share.google/…"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={autofillFromTicket}
            disabled={loading || !ticketUrl}
          >
            {loading ? "Autofilling…" : "Autofill from ticket"}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={saveWinners}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save winners"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            className="rounded-md bg-slate-900 px-3 py-2 ring-1 ring-slate-700"
            placeholder="Winner #1"
            value={w1}
            onChange={(e) => setW1(e.target.value)}
          />
          <input
            className="rounded-md bg-slate-900 px-3 py-2 ring-1 ring-slate-700"
            placeholder="Winner #2"
            value={w2}
            onChange={(e) => setW2(e.target.value)}
          />
          <input
            className="rounded-md bg-slate-900 px-3 py-2 ring-1 ring-slate-700"
            placeholder="Winner #3"
            value={w3}
            onChange={(e) => setW3(e.target.value)}
          />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-xl font-semibold">Latest saved draw (public)</h2>
        {publicWinners.length === 3 ? (
          <ol className="list-decimal ml-6 space-y-1">
            {publicWinners.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-400">No winners saved yet.</p>
        )}
      </section>
    </div>
  );
}