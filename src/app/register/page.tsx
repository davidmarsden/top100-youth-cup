'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import { useAdmin } from '@/components/AdminGate';
import { isSupabase } from '@/lib/mode';
import { load, save } from '@/lib/utils';
import { defaultSettings } from '@/lib/defaults';

type Entrant = { id: string; manager: string; club: string; rating?: number };

function uid() {
  return (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2);
}

export default function RegisterPage() {
  const { admin } = useAdmin();
  const [season, setSeason] = useState<string>(defaultSettings.season);
  const [entrants, setEntrants] = useState<Entrant[]>(() =>
    isSupabase ? [] : load<Entrant[]>('yc:entrants', [])
  );
  useEffect(() => { if (!isSupabase) save('yc:entrants', entrants); }, [entrants]);

  const [form, setForm] = useState({ manager: '', club: '', rating: '' });

  useEffect(() => {
    if (!isSupabase) return;
    (async () => {
      await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: season, age_cutoff: defaultSettings.ageCutoffISO, timezone: defaultSettings.timezone }),
      });
      const res = await fetch(`/api/entrants?season=${encodeURIComponent(season)}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    })();
  }, [season]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rating = form.rating.trim() === '' ? undefined : Number(form.rating);
    if (isSupabase) {
      await fetch('/api/entrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season,
          manager: form.manager.trim(),
          club: form.club.trim(),
          rating: isNaN(Number(rating)) ? undefined : rating,
        }),
      });
      const res = await fetch(`/api/entrants?season=${season}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      const id = uid();
      setEntrants((prev) => [
        ...prev,
        {
          id,
          manager: form.manager.trim(),
          club: form.club.trim(),
          rating: isNaN(Number(rating)) ? undefined : rating,
        },
      ]);
    }
    setForm({ manager: '', club: '', rating: '' });
    alert('Registered! Thank you.');
  };

  async function clearEntrants() {
    if (!confirm(`Clear all entrants for ${season}?`)) return;
    if (isSupabase) {
      await fetch('/api/admin/entrants/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      });
      const res = await fetch(`/api/entrants?season=${season}`);
      const json = await res.json();
      setEntrants(json.entrants || []);
    } else {
      setEntrants([]);
      if (typeof window !== 'undefined') window.localStorage.removeItem('yc:entrants');
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title={`Register your team — Season ${season}`}>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm opacity-80">Manager name</label>
            <input
              required
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
              value={form.manager}
              onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm opacity-80">Club name</label>
            <input
              required
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
              value={form.club}
              onChange={(e) => setForm((f) => ({ ...f, club: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm opacity-80">Avg rating (XI, optional)</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              placeholder="e.g., 78"
            />
          </div>
          <button className="btn-primary" type="submit">Submit</button>
        </form>
        <p className="mt-3 text-sm opacity-80">
          {isSupabase ? 'This writes to Supabase.' : 'Entries are saved locally on your device.'}
        </p>
      </SectionCard>

      <SectionCard title={`Current registrations (${entrants.length})`}>
        <div className="max-h-[420px] overflow-auto">
          <table className="table">
            <thead>
              <tr className="text-left opacity-80">
                <th className="py-1">Manager</th>
                <th className="py-1">Club</th>
                <th className="py-1 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {entrants.map((e) => (
                <tr key={e.id} className="border-t border-white/10">
                  <td className="py-1 pr-2">{e.manager}</td>
                  <td className="py-1 pr-2">{e.club}</td>
                  <td className="py-1 text-right">{e.rating ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admin && (
          <div className="mt-3 flex gap-2">
            <button className="btn border-red-400 hover:bg-red-400/20" onClick={clearEntrants}>
              Admin: Clear entrants
            </button>
            <button
              className="btn"
              onClick={async () => {
                const next = prompt('Switch to season code:', season);
                if (!next) return;
                setSeason(next);
              }}
            >
              Admin: Switch season view
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}