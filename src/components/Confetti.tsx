'use client';
import React, { useEffect, useRef } from 'react';

/** Tiny canvas confetti, no deps */
export default function Confetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    let raf = 0;

    const onResize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', onResize);

    type P = { x:number; y:number; vx:number; vy:number; s:number; a:number; hue:number };
    const parts: P[] = [];
    const spawn = (n=120) => {
      for (let i=0;i<n;i++){
        parts.push({
          x: w/2, y: h*0.2,
          vx: (Math.random()-0.5)*6,
          vy: Math.random()*-4-3,
          s: Math.random()*3+2,
          a: 1,
          hue: Math.random()*360
        });
      }
    };

    const tick = () => {
      ctx.clearRect(0,0,w,h);
      for (let i=parts.length-1;i>=0;i--){
        const p = parts[i];
        p.vy += 0.12; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.a *= 0.986;
        if (p.y > h || p.a < 0.02) { parts.splice(i,1); continue; }
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
        ctx.beginPath();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.x + p.y) * 0.02);
        ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };

    if (fire) spawn(240);
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [fire]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 w-full h-full" />;
}