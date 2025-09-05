"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function PrizeDrawAdmin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [w3, setW3] = useState("");
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);

  // New: scrape winners from RandomResult ticket
  async function autofillFromTicket() {
    if (!ticketUrl) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/draw/scrape?url=${encodeURIComponent(ticketUrl)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Scrape failed");

      // Fill winner fields
      setW1(j.winners[0] ?? "");
      setW2(j.winners[1] ?? "");
      setW3(j.winners[2] ?? "");

      toast.success("Autofilled winners from ticket");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    setLoading(true);
    try {
      const r = await fetch("/api/draw/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          adminKey: adminPassword,
          winners: [w1, w2, w3],
          ticketUrl,
          seed,
        }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to publish");
      toast.success("Results published");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Admin — Publish Results</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input
          type="password"
          placeholder="Enter admin password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="input"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ticket URL (optional)"
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={autofillFromTicket}
            className="btn btn-secondary"
            disabled={!ticketUrl || loading}
          >
            Autofill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Winner #1"
          value={w1}
          onChange={(e) => setW1(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Winner #2"
          value={w2}
          onChange={(e) => setW2(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Winner #3"
          value={w3}
          onChange={(e) => setW3(e.target.value)}
          className="input"
        />
      </div>

      <input
        type="text"
        placeholder="Seed / Notes (optional)"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        className="input mb-4"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={publish}
          disabled={loading}
          className="btn btn-primary"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => {
            setW1("");
            setW2("");
            setW3("");
            setSeed("");
            setTicketUrl("");
          }}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </div>
    </div>
  );
}