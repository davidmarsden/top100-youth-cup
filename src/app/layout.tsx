import './globals.css';
import React from 'react';
import { ThemeProvider } from './theme';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import TopNav from '@/components/TopNav';
import StorageModeBadge from '@/components/StorageModeBadge';

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
            <header className="mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Top 100 Youth Cup — S26
                </h1>
                <div className="flex items-center gap-2">
                  <StorageModeBadge />
                  <ThemeSwitcher />
                </div>
              </div>
              <TopNav />
            </header>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}