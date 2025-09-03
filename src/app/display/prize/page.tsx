'use client';
import React, { useMemo, useState } from 'react';
import Countdown from '@/components/Countdown';
import { shuffleDeterministic, canonicalize } from '@/app/prize-draw/utils'; // factor these from your prize page into a small utils file

export default function PrizeDisplay(){
  const [seed, setSeed] = useState('S26-2025-09-05T21:00Z');
  const [list, setList] = useState('');
  const [go, setGo] = useState(false);
  const cleaned = useMemo(()=> canonicalize(list.split(/\r?\n/)), [list]);
  const shuffled = useMemo(()=> shuffleDeterministic(cleaned, seed), [cleaned, seed]);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center gap-6">
      {!go ? (
        <>
          <h1 className="text-4xl font-black">Top 100 Youth Cup — Prize Draw</h1>
          <Countdown targetISO={seed.replace(/^.*(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}Z).*$/, '$1')} />
          <textarea className="w-2/3 h-48 bg-white/10 p-3 rounded-xl" value={list} onChange={e=>setList(e.target.value)} placeholder="Paste managers..." />
          <input className="w-2/3 bg-white/10 p-3 rounded-xl" value={seed} onChange={e=>setSeed(e.target.value)} />
          <button className="btn-primary" onClick={()=>setGo(true)}>Enter Full-Screen Reveal</button>
        </>
      ) : (
        <iframe src="/prize-draw" className="w-[90vw] h-[80vh] rounded-2xl border border-white/20" />
      )}
    </div>
  );
}