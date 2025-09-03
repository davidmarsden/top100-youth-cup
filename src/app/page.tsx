'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { defaultSettings, sampleEntrants } from '@/lib/defaults';
import { Entrant, Fixture, GroupTeam, Settings } from '@/lib/types';
import { load, save, makeGroupLabels } from '@/lib/utils';
import { assignGroups, computeKO32, computeStandings, generateGroupFixtures, rankWithinGroups } from '@/lib/draw';
import SectionCard from '@/components/SectionCard';
import EntrantsTable from '@/components/Entrants';
import Tabs from '@/components/Tabs';

export default function AppPage(){
  const [settings, setSettings] = useState<Settings>(()=>load('yc:settings', defaultSettings));
  const [entrants, setEntrants] = useState<Entrant[]>(()=>load('yc:entrants', sampleEntrants));
  const [groups, setGroups] = useState<GroupTeam[]>(()=>load('yc:groups', []));
  const [fixtures, setFixtures] = useState<Fixture[]>(()=>load('yc:fixtures', []));
  const [tab, setTab] = useState('Entrants');

  useEffect(()=>save('yc:settings', settings), [settings]);
  useEffect(()=>save('yc:entrants', entrants), [entrants]);
  useEffect(()=>save('yc:groups', groups), [groups]);
  useEffect(()=>save('yc:fixtures', fixtures), [fixtures]);

  const entrantsById = useMemo(()=>Object.fromEntries(entrants.map(e=>[e.id, e])), [entrants]);
  const standings = useMemo(()=>computeStandings(fixtures, settings, entrants, groups), [fixtures, settings, entrants, groups]);
  const groupedStandings = useMemo(()=>rankWithinGroups(standings), [standings]);
  const ko = useMemo(()=>computeKO32(standings, groups, settings), [standings, groups, settings]);

  const doDraw = ()=>{
    if (entrants.length<4){ alert('Need at least 4 entrants to draw groups.'); return; }
    const g = assignGroups(entrants, settings);
    setGroups(g);
    setFixtures(generateGroupFixtures(g));
    setTab('Groups');
  };

  const addEntrant = ()=>{
    const manager = prompt('Manager name?'); if(!manager) return;
    const club = prompt('Club?'); if(!club) return;
    const rating = Number(prompt('Average rating (optional)?')||'');
    setEntrants(e=>[...e, { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), manager, club, rating: isNaN(rating)?undefined:rating }]);
  };

  const importCSV = ()=>{
    const csv = prompt('Paste entrants as CSV with headers: manager,club,rating (optional).', 'manager,club,rating\nRegan Thompson,Atlético Madrid,78'); if(!csv) return;
    const lines = csv.split(/\r?\n/).filter(Boolean); const out: Entrant[] = [];
    for(let i=1;i<lines.length;i++){ const [manager,club,rating] = lines[i].split(','); if(!manager||!club) continue; out.push({ id: crypto.randomUUID?.()||Math.random().toString(36).slice(2), manager: manager.trim(), club: club.trim(), rating: rating?Number(rating):undefined }); }
    setEntrants(out);
  };

  const updateFixtureScore = (id:string, hs:string, as:string)=>{
    setFixtures(list=> list.map(f=> f.id===id ? { ...f, homeScore: hs===''?undefined:Math.max(0,Number(hs)), awayScore: as===''?undefined:Math.max(0,Number(as)), status: (hs===''||as==='')?'pending':'played' } : f));
  };
  const setForfeit = (id:string)=>{
    const who = prompt("Forfeit: type 'home' or 'away' (loses 0-3)."); if(!who) return;
    let homeScore=0, awayScore=0; if(who.toLowerCase().startsWith('home')) awayScore=3; else if(who.toLowerCase().startsWith('away')) homeScore=3; else return alert('Type home or away.');
    setFixtures(list=> list.map(f=> f.id===id ? { ...f, homeScore, awayScore, status:'forfeit', notes:`Forfeit: ${who}` } : f));
  };

  const exportJSON = ()=>{
    const blob = new Blob([JSON.stringify({ settings, entrants, groups, fixtures }, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`top100-yc-${settings.season}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <a className="btn" href="/register">Registration</a>
          <a className="btn" href="/prize-draw">Prize Draw</a>
        </div>
        <div className="text-sm opacity-80">Timezone: {settings.timezone}</div>
      </div>

      <Tabs tabs={["Entrants","Settings","Groups","Fixtures","Tables","Knockout32","Admin Notes"]} value={tab} onChange={setTab} />

      {tab==='Entrants' && (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="card">
            <h2 className="font-bold text-lg mb-2">Entrants ({entrants.length})</h2>
            <EntrantsTable entrants={entrants} />
            <div className="mt-3 flex gap-2">
              <button className="btn bg-white text-black" onClick={addEntrant}>+ Add Entrant</button>
              <button className="btn" onClick={importCSV}>Import CSV</button>
            </div>
          </section>
          <section className="card">
            <h2 className="font-bold text-lg mb-2">Draw Groups</h2>
            <p className="opacity-90 mb-3">We’ll auto-calc the number of groups from max size of {settings.maxGroupSize}.</p>
            <button className="btn-primary" onClick={doDraw}>Draw & Generate Fixtures</button>
            {groups.length>0 && (<p className="mt-3 text-sm opacity-90">Created {new Set(groups.map(g=>g.group)).size} groups and {fixtures.length} fixtures.</p>)}
          </section>
        </div>
      )}

      {tab==='Settings' && (
        <section className="card grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm opacity-80">Season</label>
            <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.season} onChange={e=>setSettings({...settings, season:e.target.value})} /></div>
          <div><label className="block text-sm opacity-80">Age cutoff (ISO)</label>
            <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.ageCutoffISO} onChange={e=>setSettings({...settings, ageCutoffISO:e.target.value})} /></div>
          <div><label className="block text-sm opacity-80">Timezone</label>
            <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.timezone} onChange={e=>setSettings({...settings, timezone:e.target.value})} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm opacity-80">Win</label><input type="number" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.pointsWin} onChange={e=>setSettings({...settings, pointsWin:Number(e.target.value)})} /></div>
            <div><label className="block text-sm opacity-80">Draw</label><input type="number" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.pointsDraw} onChange={e=>setSettings({...settings, pointsDraw:Number(e.target.value)})} /></div>
            <div><label className="block text-sm opacity-80">Loss</label><input type="number" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.pointsLoss} onChange={e=>setSettings({...settings, pointsLoss:Number(e.target.value)})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm opacity-80">Max group size</label>
              <input type="number" className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={settings.maxGroupSize} onChange={e=>setSettings({...settings, maxGroupSize: Math.max(3, Number(e.target.value))})} /></div>
            <div className="flex items-end gap-2">
              <input id="thirds" type="checkbox" className="w-5 h-5" checked={settings.bestOfThirdsToFill} onChange={e=>setSettings({...settings, bestOfThirdsToFill:e.target.checked})} />
              <label htmlFor="thirds" className="mb-1">Allow best 3rd-placed teams to reach R32</label>
            </div>
          </div>
        </section>
      )}

      {tab==='Groups' && (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {makeGroupLabels(Math.max(1, new Set(groups.map(g=>g.group)).size)).map(G=>{
            const ids = groups.filter(x=>x.group===G).map(x=>x.entrantId);
            return (
              <section key={G} className="card">
                <h3 className="font-bold text-lg mb-3">Group {G}</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {ids.map(id=> (
                    <li key={id}><span className="font-medium">{entrantsById[id]?.club||'?'}</span><span className="opacity-80"> — {entrantsById[id]?.manager}</span></li>
                  ))}
                </ol>
              </section>
            );
          })}
        </section>
      )}

      {tab==='Fixtures' && (
        <section className="space-y-6">
          {makeGroupLabels(Math.max(1, new Set(groups.map(g=>g.group)).size)).map(G=>{
            const gf = fixtures.filter(f=>f.group===G); if(gf.length===0) return null;
            const rounds = Math.max(...gf.map(x=>x.round));
            return (
              <section key={G} className="card">
                <h3 className="font-bold text-lg mb-3">Group {G}</h3>
                {Array.from({length: rounds}, (_,i)=>i+1).map(r=> (
                  <div key={r} className="mb-4">
                    <div className="opacity-80 mb-2">Round {r}</div>
                    <div className="space-y-2">
                      {gf.filter(x=>x.round===r).map(f=> (
                        <div key={f.id} className="grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-2 bg-white/5 rounded-xl p-2">
                          <div className="text-right truncate">{entrantsById[f.homeId]?.club}<span className="opacity-70"> ({entrantsById[f.homeId]?.manager})</span></div>
                          <div className="text-center">vs</div>
                          <div className="truncate">{entrantsById[f.awayId]?.club}<span className="opacity-70"> ({entrantsById[f.awayId]?.manager})</span></div>
                          <div className="flex items-center gap-1">
                            <input className="w-12 text-center rounded-lg bg-black/30 border border-white/10" value={f.homeScore ?? ''} onChange={e=>updateFixtureScore(f.id, e.target.value, String(f.awayScore ?? ''))} />
                            <span>-</span>
                            <input className="w-12 text-center rounded-lg bg-black/30 border border-white/10" value={f.awayScore ?? ''} onChange={e=>updateFixtureScore(f.id, String(f.homeScore ?? ''), e.target.value)} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button className="btn" onClick={()=>setForfeit(f.id)}>Forfeit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </section>
      )}

      {tab==='Tables' && (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedStandings).map(([G,rows])=> (
            <section key={G} className="card">
              <h3 className="font-bold text-lg mb-3">Group {G}</h3>
              <table className="table">
                <thead><tr className="text-left opacity-80">
                  <th className="py-1">#</th><th className="py-1">Club</th>
                  <th className="py-1 text-right">P</th><th className="py-1 text-right">W</th>
                  <th className="py-1 text-right">D</th><th className="py-1 text-right">L</th>
                  <th className="py-1 text-right">GF</th><th className="py-1 text-right">GA</th>
                  <th className="py-1 text-right">GD</th><th className="py-1 text-right">Pts</th>
                </tr></thead>
                <tbody>
                  {rows.map((s,idx)=>(
                    <tr key={s.entrantId} className="border-top border-white/10">
                      <td className="py-1 pr-2">{idx+1}</td>
                      <td className="py-1 pr-2"><span className="font-medium">{entrantsById[s.entrantId]?.club||'?'}</span><span className="opacity-70"> — {entrantsById[s.entrantId]?.manager}</span></td>
                      <td className="py-1 text-right">{s.played}</td><td className="py-1 text-right">{s.won}</td>
                      <td className="py-1 text-right">{s.drawn}</td><td className="py-1 text-right">{s.lost}</td>
                      <td className="py-1 text-right">{s.gf}</td><td className="py-1 text-right">{s.ga}</td>
                      <td className="py-1 text-right">{s.gd}</td><td className="py-1 text-right font-bold">{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </section>
      )}

      {tab==='Knockout32' && (
        <section className="card">
          <h3 className="font-bold text-lg mb-3">Round of 32 (auto-seeded)</h3>
          {ko.slots.length===0 ? (<p className="opacity-80">Enter group results to generate standings first.</p>) : (
            <div className="grid md:grid-cols-2 gap-3">
              {ko.seededPairs.map(([A,B],i)=> (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div className="truncate"><div className="font-semibold truncate">{entrantsById[A]?.club}</div><div className="text-xs opacity-70 truncate">{entrantsById[A]?.manager}</div></div>
                  <span className="opacity-80">vs</span>
                  <div className="text-right truncate"><div className="font-semibold truncate">{entrantsById[B]?.club}</div><div className="text-xs opacity-70 truncate">{entrantsById[B]?.manager}</div></div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab==='Admin Notes' && (
        <section className="card"><p>Admin notes…</p></section>
      )}
    </div>
  );
}