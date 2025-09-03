'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'neutral' | 'green' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'green',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1) Start with a safe default (no localStorage read here!)
  const [theme, setTheme] = useState<Theme>('green');

  // 2) Read from localStorage only on the client after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('yc:theme') as Theme | null;
    if (stored === 'neutral' || stored === 'green' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  // 3) Persist to localStorage on changes (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('yc:theme', theme);
  }, [theme]);

  // 4) Toggle body class on the client
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('theme-neutral', 'theme-green', 'theme-dark');
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);