import { Entrant, GroupTeam, Fixture, Settings, Standing } from './types';
import { uid } from './utils';

export function assignGroups(entrants: Entrant[], settings: Settings): GroupTeam[] {
  const n = entrants.length; const groupSize = settings.maxGroupSize;
  const nGroups = Math.ceil(n / groupSize);
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, nGroups).split("");
  const shuffled = [...entrants].sort(()=>Math.random()-0.5);
  const out: GroupTeam[] = [];
  for (let i=0;i<n;i++) out.push({ entrantId: shuffled[i].id, group: labels[i % nGroups] });
  return out;
}

export function generateGroupFixtures(groups: GroupTeam[]): Fixture[] {
  const by: Record<string,string[]> = {};
  for (const g of groups) { by[g.group] ??= []; by[g.group].push(g.entrantId); }
  const fixtures: Fixture[] = [];
  for (const G of Object.keys(by)) {
    const ids = by[G];
    const pairs: [string,string][] = [];
    for (let i=0;i<ids.length;i++) for (let j=i+1;j<ids.length;j++) pairs.push([ids[i], ids[j]]);
    const rounds: [string,string][][] = [];
    for (const p of pairs) {
      let placed = false;
      for (const r of rounds) {
        if (!r.some(([a,b]) => a===p[0]||a===p[1]||b===p[0]||b===p[1])) { r.push(p); placed = true; break; }
      }
      if (!placed) rounds.push([p]);
    }
    rounds.forEach((pairList, idx)=>{
      for (const [homeId, awayId] of pairList) fixtures.push({ id: uid(), group:G, round: idx+1, homeId, awayId, status:'pending', stage:'groups' });
    });
  }
  return fixtures.sort((a,b)=> a.group!<b.group!?-1:a.group!>b.group!?1:a.round-b.round);
}

export function computeStandings(fixtures: Fixture[], settings: Settings, entrants: Entrant[], groups: GroupTeam[]): Standing[] {
  const map: Record<string, Standing> = {};
  const grpOf: Record<string,string> = {}; for (const g of groups) grpOf[g.entrantId] = g.group;
  const ensure = (id:string) => map[id] ??= { entrantId:id, group: grpOf[id]||'?', played:0, won:0, drawn:0, lost:0, gf:0, ga:0, gd:0, pts:0 };
  for (const f of fixtures) {
    if (f.stage!=='groups' || f.status==='pending' || f.homeScore==null || f.awayScore==null) continue;
    const A = ensure(f.homeId), B = ensure(f.awayId);
    A.played++; B.played++;
    A.gf += f.homeScore; A.ga += f.awayScore;
    B.gf += f.awayScore; B.ga += f.homeScore;
    A.gd = A.gf - A.ga; B.gd = B.gf - B.ga;
    if (f.homeScore>f.awayScore){ A.pts+=settings.pointsWin; B.pts+=settings.pointsLoss; A.won++; B.lost++; }
    else if (f.homeScore<f.awayScore){ B.pts+=settings.pointsWin; A.pts+=settings.pointsLoss; B.won++; A.lost++; }
    else { A.pts+=settings.pointsDraw; B.pts+=settings.pointsDraw; A.drawn++; B.drawn++; }
  }
  // ensure all
  for (const e of entrants) ensure(e.id);
  return Object.values(map).sort((a,b)=> a.group===b.group ? (b.pts-a.pts || b.gd-a.gd || b.gf-a.gf) : a.group.localeCompare(b.group));
}

export function rankWithinGroups(standings: Standing[]): Record<string, Standing[]> {
  const by: Record<string, Standing[]> = {};
  for (const s of standings) { by[s.group] ??= []; by[s.group].push(s); }
  for (const g of Object.keys(by)) by[g].sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  return by;
}

export function computeKO32(standings: Standing[], groups: GroupTeam[], settings: Settings){
  const grouped = rankWithinGroups(standings);
  const groupKeys = Object.keys(grouped).sort();
  const auto = groupKeys.flatMap(g=> grouped[g].slice(0,2).map(s=>s.entrantId));
  let qualifiers = [...auto];
  const remaining = Math.max(0, 32 - qualifiers.length);
  if (remaining>0 && settings.bestOfThirdsToFill){
    const thirds = groupKeys.map(g=>grouped[g][2]).filter(Boolean)
      .sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf).slice(0, remaining).map(s=>s.entrantId);
    qualifiers = qualifiers.concat(thirds);
  }
  qualifiers = qualifiers.slice(0,32);
  const rankOf = (eid:string) => {
    const g = groups.find(x=>x.entrantId===eid)?.group || '?';
    const arr = grouped[g]||[]; const pos = arr.findIndex(z=>z.entrantId===eid);
    return pos>=0?pos+1:99;
  };
  const sorted = [...qualifiers].sort((a,b)=> rankOf(a)-rankOf(b));
  const pairs: [string,string][] = [];
  let i=0, j=sorted.length-1;
  while(i<j){ let A=sorted[i], B=sorted[j];
    const gA = groups.find(x=>x.entrantId===A)?.group; const gB = groups.find(x=>x.entrantId===B)?.group;
    if (gA && gB && gA===gB){ const alt = j-1>i?sorted[j-1]:undefined; const gAlt = alt?groups.find(x=>x.entrantId===alt)?.group:undefined; if (alt && gAlt!==gA){ [B, sorted[j]] = [alt, B]; } }
    pairs.push([A,B]); i++; j--; }
  return { slots: qualifiers, seededPairs: pairs };
}
