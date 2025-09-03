'use client';
import React, { useEffect, useState } from 'react';
import { Entrant } from '@/lib/types';
import { load, save } from '@/lib/utils';
import SectionCard from '@/components/SectionCard';

export default function RegisterPage(){
  const [entrants, setEntrants] = useState<Entrant[]>(()=>load('yc:entrants', []));
  useEffect(()=>save('yc:entrants', entrants), [entrants]);

  const [form, setForm] = useState({ manager:'', club:'', rating:'' });

  const onSubmit = (e:React.FormEvent)=>{
    e.preventDefault();
    const rating = form.rating.trim()==='' ? undefined : Number(form.rating);
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    setEntrants(prev=> [...prev, { id, manager: form.manager.trim(), club: form.club.trim(), rating: isNaN(Number(rating))?undefined:rating }]);
    setForm({ manager:'', club:'', rating:'' });
    alert('Registered! You can return to the dashboard to draw groups when ready.');
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SectionCard title="Register your team">
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
        <p className="mt-3 text-sm opacity-80">Entries are saved locally for now. In the full deployment this posts to Supabase via API.</p>
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
      </SectionCard>
    </div>
  );
}