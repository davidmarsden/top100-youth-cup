import { Bebas_Neue, Inter } from "next/font/google";
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";
// If you aren't using react-hot-toast, you can safely remove this line.
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Top 100 Youth Cup — Season 26",
  description: "Official site for the Top 100 Youth Cup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {/* Top bar */}
        <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white">
                ★
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Top 100 Youth Cup
                </div>
                <div className="text-[11px] text-slate-400 leading-none">
                  Season 26
                </div>
              </div>
            </Link>

            {/* No right-side nav buttons anymore */}
            <div className="ml-auto" />
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

        {/* Toasts (remove if not using react-hot-toast) */}
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </body>
    </html>
  );
}