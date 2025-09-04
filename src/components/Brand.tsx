export default function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Drop your SVG/PNG logo in /public/logo.svg if you have it */}
      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-blue to-brand-red ring-2 ring-white/20 grid place-items-center">
        <span className="text-white font-black">★</span>
      </div>
      <div className="leading-tight">
        <div className="text-white font-semibold tracking-tight">Top 100 Youth Cup</div>
        <div className="text-white/60 text-xs">Season 26</div>
      </div>
    </div>
  );
}