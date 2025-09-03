'use client';

import React from 'react';
import { isSupabase } from '@/lib/mode';

export default function StorageBadge() {
  const label = isSupabase ? 'Supabase' : 'Local';
  const cls = isSupabase ? 'bg-emerald-700/80' : 'bg-zinc-600/70';
  return (
    <span className={`px-2 py-1 rounded-xl text-sm ${cls}`}>
      Storage: {label}
    </span>
  );
}