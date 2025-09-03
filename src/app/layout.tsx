import './globals.css';
import React from 'react';
import { ThemeProvider } from './theme';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export const metadata = {
  title: 'Top 100 Youth Cup — S26',
  description: 'Registration, Groups, Fixtures, Tables, Knockout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="max-w-6xl mx-auto p-4">
            <header className="flex items-center justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Top 100 Youth Cup — S26
              </h1>
              <ThemeSwitcher />
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

// src/components/ThemeSwitcher.tsx
'use client';
import React from 'react';
import { useTheme } from '@/app/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'green' ? 'neutral' : theme === 'neutral' ? 'dark' : 'green';
  return (
    <button className="btn" onClick={() => setTheme(next)}>
      Theme: {theme}
    </button>
  );
}