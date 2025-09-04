import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Top 100 Youth Cup",
  description: "Season 26 · Fixtures, standings and prize draw",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-pitch">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}