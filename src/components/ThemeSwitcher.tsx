'use client';
import React from 'react';
import { useTheme } from '@/app/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'green' ? 'neutral' : theme === 'neutral' ? 'dark' : 'green';
  return (
    <button className="btn" onClick={() => setTheme(next)} title="Cycle theme">
      Theme: {theme}
    </button>
  );
}