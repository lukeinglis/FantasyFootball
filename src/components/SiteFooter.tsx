export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0C2340]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-[#DD550C]">
              Greybushes &amp; Chili Dogs
            </p>
            <p className="mt-1 text-xs text-gray-400 italic">
              A bunch of degenerates who claim to be extraordinary swindlers.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            &copy; {year} Greybushes &amp; Chili Dogs. 10+ years of glorious
            mediocrity.
          </p>
        </div>
      </div>
    </footer>
  );
}
