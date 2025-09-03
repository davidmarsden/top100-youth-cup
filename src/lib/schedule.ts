export function saturdaysBetween(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const tz = 'Europe/London';
  const start = new Date(startISO + 'T12:00:00'); // midday to avoid DST edge
  const end = new Date(endISO + 'T23:59:59');
  const d = new Date(start);
  // move to first Saturday
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  while (d <= end) {
    const y = d.getFullYear(), m = (d.getMonth()+1).toString().padStart(2,'0'), day = d.getDate().toString().padStart(2,'0');
    out.push(`${y}-${m}-${day}T15:00:00`); // kickoff 15:00 local (adjust in UI)
    d.setDate(d.getDate() + 7);
  }
  return out;
}

// Simple allocator: consume dates per round, create legs accordingly
export type LegSpec = { label: string; legs: 1 | 2 }; // e.g. { label: 'Cup R16', legs: 2 }
export function allocateRoundDates(dates: string[], rounds: LegSpec[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  let i = 0;
  for (const r of rounds) {
    const needed = r.legs === 2 ? 2 : 1;
    if (i + needed > dates.length) break;
    map[r.label] = dates.slice(i, i + needed);
    i += needed;
  }
  return map; // { 'Group R1': ['2025-09-20T15:00:00'], 'Cup R32': ['...'], 'Cup QF': ['...','...'], ... }
}