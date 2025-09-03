'use client';
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { Entrant } from '@/lib/types';
import { load, save } from '@/lib/utils';
import SectionCard from '@/components/SectionCard';
import { isSupabase } from '@/lib/mode';
import { defaultSettings } from '@/lib/defaults';

export default function RegisterPage(){
  const [season, setSeason] = useState<string>(()=>load('yc:settings', defaultSettings).season);
  const [entrants, setEntrants] = useState<Entrant[]>(()=> isSupabase ? [] : load('yc:entrants', []));
  const [form, setForm] = useState({ manager:'', club:'', rating:'' });

  // Load entrants (Supabase mode)
  useEffect(()=>{ (async ()=>{
    if (!isSupabase) return;
    await fetch('/api/seasons', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code: season, age_cutoff: new Date().toISOString().slice(0,10), timezone: 'Europe/London' })});
    const res = await fetch(`/api/entrants?season=${season}`); const json = await res.json();
    setEntrants(json.entrants||[]);
  })(); }, [season]);

  // Local mode persist
  useEffect(()=>{ if (!isSupabase) save('yc:entrants', entrants); }, [entrants]);

  const onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault();
    const rating = form.rating.trim()==='' ? undefined : Number(form.rating);
    if (isSupabase) {
      await fetch('/api/entrants', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ season, manager: form.manager.trim(), club: form.club.trim(), rating: isNaN(Number(rating))?undefined:rating })
      });
      const res = await fetch(`/api/entrants?season=${season}`); const json = await res.json();
      setEntrants(json.entrants||[]);
    } else {
      const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      setEntrants(prev=> [...prev, { id, manager: form.manager.trim(), club: form.club.trim(), rating: isNaN(Number(rating))?undefined:rating }]);
    }
    setForm({ manager:'', club:'', rating:'' });
    alert('Registered!');
  };

  const clearAll = async ()=>{
    if (!confirm('Clear all entrants for this season?')) return;
    if (isSupabase) {
      await fetch(`/api/entrants?season=${season}`, { method:'DELETE' });
      const res = await fetch(`/api/entrants?season=${season}`); const json = await res.json();
      setEntrants(json.entrants||[]);
    } else {
      setEntrants([]); if (typeof window !== 'undefined') window.localStorage.removeItem('yc:entrants');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title={`Register your team (Season ${season})`}>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm opacity-80">Manager name</label>
            <input required className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={form.manager} onChange={e=>setForm(f=>({...f, manager:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm opacity-80">Club name</label>
            <input required className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={form.club} onChange={e=>setForm(f=>({...f, club:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm opacity-80">Avg rating (XI, optional)</label>
            <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={form.rating} onChange={e=>setForm(f=>({...f, rating:e.target.value}))} placeholder="e.g., 78" />
          </div>
          <button className="btn-primary" type="submit">Submit</button>
        </form>
        <p className="mt-3 text-sm opacity-80">{isSupabase ? 'Stored in Supabase.' : 'Stored locally (only visible to you).'}</p>
      </SectionCard>

      <SectionCard title="Current registrations">
        <div className="max-h-[420px] overflow-auto">
          <table className="table">
            <thead><tr className="text-left opacity-80">
              <th className="py-1">Manager</th><th className="py-1">Club</th><th className="py-1 text-right">Rating</th>
            </tr></thead>
            <tbody>
              {entrants.map(e=> (
                <tr key={e.id} className="border-t border-white/10">
                  <td className="py-1 pr-2">{e.manager}</td>
                  <td className="py-1 pr-2">{e.club}</td>
                  <td className="py-1 text-right">{e.rating ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <button className="btn border-red-400 hover:bg-red-400/20" onClick={clearAll}>Clear entrants</button>
        </div>
      </SectionCard>
    </div>
  );
}