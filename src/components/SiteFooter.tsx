export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 bg-[linear-gradient(180deg,#8B6914,#5C3A0E)] border-t-4 border-[#D4A847]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p
              className="font-[family-name:var(--font-heading)] text-lg uppercase tracking-widest text-[#D4A847]"
              style={{ letterSpacing: "2px" }}
            >
              Greybushes &amp; Chili Dogs
            </p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-xs font-semibold text-[#C4A24E] italic">
              A bunch of degenerates who claim to be extraordinary swindlers.
            </p>
          </div>
          <p className="font-[family-name:var(--font-body)] text-xs font-semibold text-[#C4A24E]">
            &copy; {year} Greybushes &amp; Chili Dogs. 10+ years of glorious
            mediocrity.
          </p>
        </div>
      </div>
    </footer>
  );
}
