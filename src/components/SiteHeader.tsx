"use client";
import Link from "next/link";
import Brand from "./Brand";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-brand-bg/60 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-1">
          <Link className="btn btn-ghost" href="/">Home</Link>
          <Link className="btn btn-ghost" href="/register">Register</Link>
          <Link className="btn btn-primary" href="/draw">Prize draw</Link>
        </nav>
      </div>
    </header>
  );
}