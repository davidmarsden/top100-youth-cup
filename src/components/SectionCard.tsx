import React from 'react';
export default function SectionCard({title, children}:{title:string; children: React.ReactNode}){
  return (
    <section className="card">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}
