'use client';
import React, { useMemo, useRef, useState } from 'react';
import SectionCard from '@/components/SectionCard';
import Confetti from '@/components/Confetti';

/** —— Deterministic helpers —— */
function hashString(s: string){ // djb2
  let h = 5381;
  for (let i=0;i<s.length;i++){ h = ((h<<5)+h) + s.charCodeAt(i); h |= 0; }
  return h>>>0;
}
function xorshift32(seed: number){
  let x = seed>>>0;
  return function(){ // returns [0,1)
    x ^= x << 13; x >>>= 0;
    x ^= x << 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return ((x>>>0) / 0xFFFFFFFF);
  }
}
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
function canonicalize(lines: string[]): string[]{
  const out: string[] = []; const seen = new Set<string>();
  for (const raw of lines){
    const t = raw.trim(); if (!t) continue;
    const name = CANON[t] ?? t;
    if (!seen.has(name)){ seen.add(name); out.push(name); }
  }
  return out;
}
function shuffleDeterministic<T>(arr: T[], seedStr: string): T[]{
  const rng = xorshift32(hashString(seedStr)); const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(rng() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** —— Minimal sound (WebAudio): drumroll + hit —— */
function playDrumroll(seconds = 3.2){
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + seconds);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + seconds + 0.05);
  } catch {}
}
function playHit(){
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

/** —— Default text area empty for flexibility —— */
const DEFAULT_LIST = ``;

export default function PrizeDrawPage(){
  const [seed, setSeed] = useState('S26-2025-09-03');
  const [textarea, setTextarea] = useState(DEFAULT_LIST);
  const cleaned = useMemo(()=> canonicalize(textarea.split(/\r?\n/)), [textarea]);
  const shuffled = useMemo(()=> shuffleDeterministic(cleaned, seed), [cleaned, seed]);

  // Theatre state
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [confetti, setConfetti] = useState(false);
  const tickerRef = useRef<number | null>(null);

  const startDraw = async () => {
    if (cleaned.length < 3) { alert('Need at least 3 eligible names.'); return; }
    setIsDrawing(true);
    setRevealed([]); setConfetti(false);

    const winners = shuffled.slice(0, 3);
    playDrumroll(3.2);

    const revealOne = (idx: number) => {
      const spinMs = 1800; const interval = 60;
      const start = performance.now();
      if (tickerRef.current) window.clearInterval(tickerRef.current);
      let i = 0;
      tickerRef.current = window.setInterval(() => {
        i++;
        const el = document.getElementById('ticker');
        if (!el) return;
        el.textContent = cleaned[(i % cleaned.length)];
        if (performance.now() - start > spinMs) {
          window.clearInterval(tickerRef.current!);
          const w = winners[idx];
          el.textContent = w;
          setRevealed((r) => [...r, w]);
          playHit();
          if (idx === 2) setConfetti(true);
        }
      }, interval) as unknown as number;
    };

    revealOne(0);
    await new Promise(r => setTimeout(r, 3500));
    revealOne(1);
    await new Promise(r => setTimeout(r, 3500));
    revealOne(2);
    await new Promise(r => setTimeout(r, 800));
    setIsDrawing(false);
  };

  const exportJSON = () => {
    const data = { seed, eligible: cleaned, shuffled, winners: shuffled.slice(0,3), timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `yc-prizedraw-${seed}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyAnnouncement = async () => {
    const w = shuffled.slice(0,3);
    const lines = [
      `🎉 Top 100 Youth Cup S26 — Prize Draw Winners`,
      `Seed: ${seed}`,
      `1) ${w[0]}`,
      `2) ${w[1]}`,
      `3) ${w[2]}`,
      `(${new Date().toLocaleString()})`
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    alert('Copied winners announcement to clipboard!');
  };

  return (
    <div className="relative">
      <Confetti fire={confetti} />
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Prize Draw — Input">
          <div className="space-y-3">
            <div>
              <label className="block text-sm opacity-80">Seed (public & reproducible)</label>
              <input className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={seed} onChange={e=>setSeed(e.target.value)} />
              <p className="text-xs opacity-70 mt-1">Tip: include Season + ISO date/time (e.g., S26-2025-09-05T21:00Z).</p>
            </div>
            <div>
              <label className="block text-sm opacity-80">Eligible names (one per line)</label>
              <textarea className="w-full min-h-[220px] px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={textarea} onChange={e=>setTextarea(e.target.value)} placeholder="Paste manager names here..." />
              <p className="text-xs opacity-70 mt-1">For managers, we simply trim & de-duplicate (club canonicalization is kept for legacy lists).</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={()=>setTextarea(canonicalize(textarea.split(/\r?\n/)).join('\n'))}>Apply Canonical (safe)</button>
              <button className="btn" onClick={exportJSON}>Export Signed JSON</button>
              <button className="btn" onClick={copyAnnouncement}>Copy Announcement</button>
              <button className="btn-primary" onClick={startDraw} disabled={isDrawing}>🎲 Start Draw</button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Theatre & Results">
          <div className="space-y-4">
            <div className="h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div id="ticker" className="text-xl font-bold animate-ticker text-center px-3">Ready?</div>
            </div>
            <div>
              <div className="opacity-90 mb-2">Revealed Winners</div>
              <ol className="list-decimal list-inside space-y-2 text-lg">
                {revealed.map((w,i)=> <li key={i} className="font-semibold">{w}</li>)}
              </ol>
              {!revealed.length && <p className="text-sm opacity-70">Press “Start Draw” to reveal winners one by one.</p>}
            </div>
            <div>
              <div className="opacity-90 mb-1">Full shuffled order (deterministic)</div>
              <ol className="list-decimal list-inside space-y-1 max-h-[240px] overflow-auto pr-2">
                {shuffled.map((n,i)=> <li key={i}>{n}</li>)}
              </ol>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}