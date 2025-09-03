import { Entrant } from './types';

export function seedIntoGroupsByRating(entrants: Entrant[], groupsCount: number): Entrant[][] {
  const sorted = [...entrants].sort((a,b)=> (b.rating ?? 0) - (a.rating ?? 0));
  const potSize = groupsCount;
  const pots: Entrant[][] = [];
  for (let i=0; i<sorted.length; i+=potSize) pots.push(sorted.slice(i, i+potSize));
  const groups: Entrant[][] = Array.from({ length: groupsCount }, ()=>[]);
  // random draw per pot
  for (const pot of pots) {
    const bag = [...pot];
    for (let g=0; g<groupsCount; g++) {
      if (!bag.length) break;
      const idx = Math.floor(Math.random() * bag.length);
      const pick = bag.splice(idx,1)[0];
      if (pick) groups[g].push(pick);
    }
  }
  return groups; // array of groups, each with entrants
}