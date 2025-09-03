'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'neutral' | 'green' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t:Theme)=>void }>({ theme: 'green', setTheme: ()=>{} });

export function ThemeProvider({ children }:{ children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('green');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('yc:theme') as Theme | null;
    if (stored==='neutral' || stored==='green' || stored==='dark') setTheme(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('yc:theme', theme);
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.classList.remove('theme-neutral','theme-green','theme-dark');
      html.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);