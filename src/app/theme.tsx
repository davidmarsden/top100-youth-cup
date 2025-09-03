'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'neutral' | 'green' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t:Theme)=>void }>({ theme: 'green', setTheme: ()=>{} });

export function ThemeProvider({ children }:{ children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(()=> (localStorage.getItem('yc:theme') as Theme) || 'green');
  useEffect(()=> localStorage.setItem('yc:theme', theme), [theme]);
  useEffect(()=>{
    const body = document.body;
    body.classList.remove('theme-neutral','theme-green','theme-dark');
    body.classList.add(`theme-${theme}`);
  }, [theme]);
  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);