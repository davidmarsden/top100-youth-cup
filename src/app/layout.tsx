import './globals.css';
import React from 'react';
import { ThemeProvider } from './theme';
import Link from 'next/link';
import { AdminGateProvider, AdminBadge } from '@/components/AdminGate';
import StorageBadge from '@/components/StorageBadge'; // if you have one; otherwise remove

export const metadata = {
  title: 'Top 100 Youth Cup — {SEASON}',
  description: 'Registration, Groups, Fixtures, Tables, Knockout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AdminGateProvider>
            <div className="max-w-6xl mx-auto p-4">
              <header className="flex items-center justify-between mb-4">
                <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tight">
                  Top 100 Youth Cup — S26
                </Link>
                <div className="flex items-center gap-2">
                  {/* Optional: show whether Supabase/local is active */}
                  {typeof StorageBadge !== 'undefined' && <StorageBadge />}
                  <AdminBadge />
                </div>
              </header>

              {/* Top nav (keeps consistent menu across pages) */}
              <nav className="flex flex-wrap gap-2 mb-4">
                <Link href="/" className="btn bg-white text-black">Dashboard</Link>
                <Link href="/register" className="btn">Register</Link>
                <Link href="/fixtures" className="btn">Fixtures</Link>
                <Link href="/prize-draw" className="btn">Prize Draw</Link>
                <Link href="/schedule" className="btn">Schedule</Link>
                <Link href="/seasons" className="btn">Seasons</Link>
              </nav>

              {children}
            </div>
          </AdminGateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}