'use client';
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import SectionCard from '@/components/SectionCard';

export default function SeasonsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{ (async ()=>{
    const res = await fetch('/api/seasons'); const json = await res.json();
    setRows(json.seasons||[]);
  })(); }, []);
  return (
    <SectionCard title="Season Archive">
      <table className="table">
        <thead><tr><th>Code</th><th>Age cutoff</th><th>Timezone</th><th>Created</th></tr></thead>
        <tbody>
          {rows.map(s=>(
            <tr key={s.id} className="border-t border-white/10">
              <td className="py-1 pr-2"><a className="underline" href={`/seasons/${s.code}`}>{s.code}</a></td>
              <td className="py-1 pr-2">{s.age_cutoff}</td>
              <td className="py-1 pr-2">{s.timezone}</td>
              <td className="py-1 pr-2">{new Date(s.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}