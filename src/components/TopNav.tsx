'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const items = [
  { href: '/', label: 'Dashboard' },        // can be read-only if you want
  { href: '/register', label: 'Register' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/prize-draw', label: 'Prize Draw' },
  { href: '/schedule', label: 'Schedule' }, // admin-heavy, but okay to view
  { href: '/seasons', label: 'Seasons' },
  // { href: '/admin', label: 'Admin' },     // if you split
];

export default function TopNav(){
  const path = usePathname();
  return (
    <nav className="mt-3 flex flex-wrap gap-2">
      {items.map(it => (
        <Link key={it.href} href={it.href}
          className={`px-3 py-2 rounded-xl border ${
            path===it.href ? 'bg-white text-black border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}