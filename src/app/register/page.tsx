// src/app/register/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Entrant } from '@/lib/types';
import { useSeason } from '@/components/SeasonContext';
import { load, save } from '@/lib/utils';
import { useAdmin } from '@/components/AdminGate';

export default function RegisterPage() {
  const SEASON = useSeason();
  const isAdmin = useAdmin();

  // If you’re using Supabase for entrants, prefer fetching from API.
  // In the client, only NEXT_PUBLIC_* env vars are exposed.
  const isSupabase = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );

  // ✅ Always provide a synchronous default for useState
  const [entrants, setEntrants] = useState<Entrant[]>([]);

  // Load any locally saved entrants (only when not using Supabase)
  useEffect(() => {
    if (isSupabase) return;

    (async () => {
      // If your load signature is load<T>(key: string, fallback: T),
      // this still works because we coalesce to [] below.
      const saved = await load<Entrant[]>('yc:entrants', []);
      setEntrants(saved ?? []);
    })();
  }, [isSupabase]);

  // Persist locally whenever entrants change (only when not using Supabase)
  useEffect(() => {
    if (isSupabase) return;
    save('yc:entrants', entrants);
  }, [isSupabase, entrants]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-sm text-gray-500">Season: {SEASON}</p>
      </header>

      {!isSupabase && (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium mb-2">Local Entrants</h2>
          {entrants.length === 0 ? (
            <p className="text-sm text-gray-500">No entrants yet.</p>
          ) : (
            <ul className="list-disc ml-6">
              {entrants.map((e) => (
                <li key={e.id}>
                  {e.manager}
                  {e.club ? ` (${e.club})` : ''}
                  {e.seed ? ` — seed ${e.seed}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isSupabase && (
        <section className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">
            Supabase mode detected. Fetch entrants from your API or Supabase client here.
          </p>
        </section>
      )}

      {isAdmin && (
        <p className="text-xs text-gray-400">
          Admin: you can add controls here to modify entrants and call <code>setEntrants</code>.
        </p>
      )}
    </main>
  );
}