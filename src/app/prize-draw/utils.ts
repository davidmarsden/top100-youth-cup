// Deterministic helpers + canonicalize shared by prize pages

export function hashString(s: string){ // djb2
  let h = 5381;
  for (let i=0;i<s.length;i++){ h = ((h<<5)+h) + s.charCodeAt(i); h |= 0; }
  return h>>>0;
}
export function xorshift32(seed: number){
  let x = seed>>>0;
  return function(){ // returns [0,1)
    x ^= x << 13; x >>>= 0;
    x ^= x << 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return ((x>>>0) / 0xFFFFFFFF);
  }
}
export function shuffleDeterministic<T>(arr: T[], seedStr: string): T[]{
  const rng = xorshift32(hashString(seedStr)); const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(rng() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// For legacy club lists we fixed typos; for manager lists this just trims + dedupes
const CANON: Record<string,string> = {
  'Anderlect': 'Anderlecht',
  'Atletico Madrid': 'Atlético Madrid',
  'Bayern Munich': 'Bayern München',
  'Besiktas': 'Beşiktaş',
  'Dortmund': 'Borussia Dortmund',
  'Leverkusen': 'Bayer Leverkusen',
  'Man City': 'Manchester City',
  'Milan': 'AC Milan',
  'Monchengladbach': 'Borussia Mönchengladbach',
  'Sc Internacional': 'SC Internacional',
  'Sevlle': 'Sevilla',
  'Tottenham': 'Tottenham Hotspur',
};
export function canonicalize(lines: string[]): string[]{
  const out: string[] = []; const seen = new Set<string>();
  for (const raw of lines){
    const t = raw.trim(); if (!t) continue;
    const name = CANON[t] ?? t;
    if (!seen.has(name)){ seen.add(name); out.push(name); }
  }
  return out;
}