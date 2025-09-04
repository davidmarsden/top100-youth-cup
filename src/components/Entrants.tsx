// src/components/Entrants.tsx
'use client';

import React from 'react';
import type { Entrant } from '@/lib/types';

// Only allow sorting by keys that actually exist on Entrant.
// If some of these don't exist on your Entrant type, Extract<> will remove them.
export type SortKey = Extract<keyof Entrant, 'manager' | 'club' | 'seed' | 'rating'>;

type Props = {
  entrants: Entrant[];
  sort: SortKey;
  dir?: 'asc' | 'desc';
};

export default function Entrants({ entrants, sort, dir = 'asc' }: Props) {
  const direction = dir === 'asc' ? 1 : -1;

  const sorted = React.useMemo(() => {
    const a = entrants.slice();

    a.sort((x, y) => {
      // TS now knows `sort` is a key of Entrant
      const xv = x[sort] as unknown as string | number | null | undefined;
      const yv = y[sort] as unknown as string | number | null | undefined;

      // Special-case numeric sort for rating (if present)
      if (sort === ('rating' as SortKey)) {
        const xn = Number(xv ?? 0);
        const yn = Number(yv ?? 0);
        if (xn === yn) return 0;
        return xn < yn ? -1 * direction : 1 * direction;
      }

      const xs = String(xv ?? '');
      const ys = String(yv ?? '');
      const cmp = xs.localeCompare(ys, undefined, { sensitivity: 'base' });
      return cmp * direction;
    });

    return a;
  }, [entrants, sort, dir, direction]);

  return (
    <ul className="list-disc ml-6">
      {sorted.map((e) => (
        <li key={e.id}>
          {e.manager}
          {e.club ? ` (${e.club})` : ''}
          {e.seed ? ` — seed ${e.seed}` : ''}
          {/* Render rating if you have it */}
          {'rating' in e && (e as any).rating != null ? ` — rating ${(e as any).rating}` : ''}
        </li>
      ))}
    </ul>
  );
}