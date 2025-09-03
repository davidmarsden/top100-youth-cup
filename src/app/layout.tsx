import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Top 100 Youth Cup — S26',
  description: 'Registration, Groups, Fixtures, Tables, Knockout'
};

export default function RootLayout({ children }:{children: React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <div className="max-w-6xl mx-auto p-4">
          <header className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Top 100 Youth Cup — S26</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}