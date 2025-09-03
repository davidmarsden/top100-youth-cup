'use client';
import React, { useEffect, useState } from 'react';

export default function Countdown({ targetISO }:{ targetISO: string }) {
  const [left, setLeft] = useState<number>(()=> new Date(targetISO).getTime() - Date.now());
  useEffect(()=>{
    const t = setInterval(()=> setLeft(new Date(targetISO).getTime() - Date.now()), 250);
    return ()=> clearInterval(t);
  }, [targetISO]);
  if (left <= 0) return <span className="font-bold">Now!</span>;
  const sec = Math.floor(left/1000)%60;
  const min = Math.floor(left/1000/60)%60;
  const hr  = Math.floor(left/1000/60/60)%24;
  const day = Math.floor(left/1000/60/60/24);
  const pad = (n:number)=> n.toString().padStart(2,'0');
  return <span className="text-2xl font-black">{day}d {pad(hr)}:{pad(min)}:{pad(sec)}</span>;
}