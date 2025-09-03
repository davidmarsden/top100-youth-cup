'use client';
import React from 'react';
import { Entrant } from '@/lib/types';

export default function EntrantsTable({ entrants }:{entrants: Entrant[]}){
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="table">
        <thead><tr className="text-left opacity-80">
          <th className="py-1">Manager</th>
          <th className="py-1">Club</th>
          <th className="py-1 text-right">Rating</th>
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
  );
}
