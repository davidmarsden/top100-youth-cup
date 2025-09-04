export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-white/60 text-sm">
        <div>© {new Date().getFullYear()} Top 100 Youth Cup · Community-run</div>
      </div>
    </footer>
  );
}