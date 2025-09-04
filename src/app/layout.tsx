import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Top 100 Youth Cup",
  description: "Prize draw, registration, and tournament organiser",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-5xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}