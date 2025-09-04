import { Bebas_Neue, Inter } from "next/font/google";
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
…
<body className={`${display.variable} ${inter.variable} …`}>


import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Top 100 Youth Cup",
  description: "Season 26 · Fixtures, standings and prize draw",
  icons: {
    icon: "/favicon.ico",        // optional if you have it
    shortcut: "/icon-192.png",   // optional
    apple: "/icon-192.png",      // optional
  },
  openGraph: {
    title: "Top 100 Youth Cup – Season 26",
    description: "Live fixtures, standings & official three-winner prize draw.",
    url: "https://<your-domain>",        // set your domain
    siteName: "Top 100 Youth Cup",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Top 100 Youth Cup" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Top 100 Youth Cup – Season 26",
    description: "Live fixtures, standings & prize draw.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-pitch">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}