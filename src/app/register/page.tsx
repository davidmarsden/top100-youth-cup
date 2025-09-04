// src/app/register/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Entrant } from '@/lib/types';
import { useSeason } from '@/components/SeasonContext';
import { load, save } from '@/lib/utils';
import { useAdmin } from '@/components/AdminGate';

export default function RegisterPage() {
  // ⬇️ useSeason returns a SeasonContextValue (object). We only render its `season` string.
  const { season } = useSeason();
  const isAdmin = useAdmin();

  // In the browser we can only see NEXT_PUBLIC_* envs; use those to detect Supabase mode.
  const isSupabase = useMemo(
    () =>
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );

  // Local entrants state; initializer must be synchronous (an array), not async.
  const [entrants, setEntrants] = useState<Entrant[]>([]);

  // Load locally stored entrants (only when not using Supabase)
  useEffect(() => {
    if (isSupabase) return;
    (async () => {
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
        <p className="text-sm text-gray-500">Season: {season}</p>
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
          Admin: add controls here to modify entrants and call <code>setEntrants</code>.
        </p>
      )}
    </main>
  );
}