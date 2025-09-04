// Root layout required by Next.js App Router
import "./globals.css";

export const metadata = {
  title: "Top 100 Youth Cup",
  description: "S26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
      </body>
    </html>
  );
}