export function buildShieldBracketIds(nonQualifiers: string[], cupR32Losers: string[]){
  const pool = [...nonQualifiers, ...cupR32Losers];
  // make pairs; if odd, last gets a bye (auto-advances)
  const pairs: [string, string | null][] = [];
  for (let i=0; i<pool.length; i+=2) {
    pairs.push([pool[i], pool[i+1] ?? null]);
  }
  return pairs; // R1 pairings (single-leg). Null means a bye.
}