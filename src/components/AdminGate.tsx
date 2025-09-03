'use client';
import React, { useEffect, useState } from 'react';

export function useAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(()=>{
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('yc:admin') : null;
    setAdmin(v === '1');
  }, []);
  const enable = (k: string) => {
    if (k === (process.env.NEXT_PUBLIC_ADMIN_KEY || '')) {
      setAdmin(true);
      if (typeof window !== 'undefined') window.localStorage.setItem('yc:admin','1');
      alert('Admin mode enabled');
    } else {
      alert('Wrong key');
    }
  };
  const disable = () => {
    setAdmin(false);
    if (typeof window !== 'undefined') window.localStorage.removeItem('yc:admin');
  };
  return { admin, enable, disable };
}

export default function AdminGate() {
  const { admin, enable, disable } = useAdmin();
  const [key, setKey] = useState('');
  if (admin) return <button className="btn" onClick={disable}>Admin: ON (click to disable)</button>;
  return (
    <div className="flex gap-2">
      <input className="px-2 py-1 rounded bg-white/10 border border-white/20" placeholder="Admin key"
        value={key} onChange={e=>setKey(e.target.value)} />
      <button className="btn" onClick={()=>enable(key)}>Enable Admin</button>
    </div>
  );
}