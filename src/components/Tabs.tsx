'use client';
import React from 'react';
export default function Tabs({tabs, value, onChange}:{tabs:string[]; value:string; onChange:(v:string)=>void}){
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {tabs.map(t => (
        <button key={t} onClick={()=>onChange(t)} className={`px-3 py-2 rounded-xl border ${value===t? 'bg-white text-black border-white':'bg-white/10 border-white/20 hover:bg-white/20'}`}>{t}</button>
      ))}
    </nav>
  );
}
