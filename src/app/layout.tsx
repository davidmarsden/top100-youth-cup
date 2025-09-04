import { Bebas_Neue, Inter } from "next/font/google";
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });



// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Top 100 Youth Cup — Prize Draw",
  description: "Official Season 26 prize draw — three winners, publicly viewable.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0f1a] text-white">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1a]/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 grid place-items-center shadow">
                <span className="text-white text-sm font-bold">★</span>
              </div>
              <div className="leading-tight">
                <div className="font-semibold">Top 100 Youth Cup</div>
                <div className="text-xs text-gray-400">Season 26</div>
              </div>
            </Link>
            {/* No right-side nav buttons anymore */}
            <div className="ml-auto" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}