'use client';
import React, { useMemo, useState } from 'react';
import { Entrant } from '@/lib/types';

type SortKey = 'manager' | 'club' | 'rating';
export default function EntrantsTable({ entrants, onClear }: { entrants: Entrant[]; onClear?: ()=>void }) {
  const [sort, setSort] = useState<SortKey>('manager');
  const [dir, setDir] = useState<1|-1>(1);

  const sorted = useMemo(() => {
    const a = entrants.slice();
    a.sort((x,y) => {
      const xv = (x[sort] ?? '') as any;
      const yv = (y[sort] ?? '') as any;
      if (sort==='rating') return (Number(xv||0) - Number(yv||0)) * dir;
      return String(xv).localeCompare(String(yv)) * dir;
    });
    return a;
  }, [entrants, sort, dir]);

  const setSortKey = (k: SortKey) => {
    if (k===sort) setDir(dir===1?-1:1); else { setSort(k); setDir(1); }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm opacity-80">Sort:</span>
        <button className={`btn ${sort==='manager'?'bg-white text-black':''}`} onClick={()=>setSortKey('manager')}>Manager</button>
        <button className={`btn ${sort==='club'?'bg-white text-black':''}`} onClick={()=>setSortKey('club')}>Club</button>
        <button className={`btn ${sort==='rating'?'bg-white text-black':''}`} onClick={()=>setSortKey('rating')}>Rating</button>
        <span className="text-xs opacity-70 ml-2">{dir===1?'↑ asc':'↓ desc'}</span>
        {onClear && <button className="btn border-red-400 hover:bg-red-400/20 ml-auto" onClick={onClear}>Clear entrants</button>}
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="table">
          <thead><tr className="text-left opacity-80">
            <th className="py-1">Manager</th>
            <th className="py-1">Club</th>
            <th className="py-1 text-right">Rating</th>
          </tr></thead>
          <tbody>
            {sorted.map(e=> (
              <tr key={e.id} className="border-t border-white/10">
                <td className="py-1 pr-2">{e.manager}</td>
                <td className="py-1 pr-2">{e.club}</td>
                <td className="py-1 text-right">{e.rating ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}