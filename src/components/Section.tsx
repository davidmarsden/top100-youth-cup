import React from "react";

export default function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="card p-4">{children}</div>
    </section>
  );
}