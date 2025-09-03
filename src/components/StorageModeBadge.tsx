'use client';
import React from 'react';

export default function StorageModeBadge(){
  const supa = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border ${
      supa ? 'bg-green-500/20 border-green-400 text-green-100' :
             'bg-yellow-500/20 border-yellow-400 text-yellow-100'
    }`}>
      {supa ? 'Storage: Supabase' : 'Storage: Local only'}
    </span>
  );
}