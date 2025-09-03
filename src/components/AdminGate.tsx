'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Ctx = { admin: boolean; refresh: () => void };
const AdminCtx = createContext<Ctx>({ admin: false, refresh: () => {} });

export function AdminGateProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);

  const refresh = () => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => setAdmin(!!d.admin))
      .catch(() => setAdmin(false));
  };

  useEffect(() => { refresh(); }, []);

  return <AdminCtx.Provider value={{ admin, refresh }}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  return useContext(AdminCtx);
}

export function AdminBadge() {
  const { admin, refresh } = useAdmin();

  async function login() {
    const pass = prompt('Enter admin passcode:');
    if (!pass) return;
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass }),
    });
    if (r.ok) {
      alert('Admin mode enabled.');
      refresh();
    } else {
      const { error } = await r.json().catch(() => ({ error: 'Login failed' }));
      alert(error || 'Login failed');
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    alert('Admin mode disabled.');
    refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-xl text-sm ${admin ? 'bg-emerald-600/80' : 'bg-zinc-600/60'}`}>
        {admin ? 'Admin: on' : 'Admin: off'}
      </span>
      {admin ? (
        <button className="btn" onClick={logout}>Sign out</button>
      ) : (
        <button className="btn bg-white text-black" onClick={login}>Admin sign in</button>
      )}
    </div>
  );
}