import historyData from "@/data/history.json";
import allTimeRecords from "@/data/all-time-records.json";

const seasons = (historyData as { seasons: unknown[] }).seasons.length;
const matchups = (allTimeRecords as { totalMatchups: number }).totalMatchups;

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-rule bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
        <p className="font-[family-name:var(--wire-display)] text-[18px] font-bold uppercase">
          Greybushes &amp; Chili Dogs
        </p>
        <p className="mt-1 max-w-[60ch] text-[14px] text-ink-soft">
          A bunch of degenerates who claim to be extraordinary swindlers.
        </p>
        <p className="mt-3 font-[family-name:var(--wire-mono)] text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Est. 2015 &middot; {seasons} seasons &middot;{" "}
          {matchups.toLocaleString("en-US")} matchups played
        </p>
        <p className="mt-2 font-[family-name:var(--wire-mono)] text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          Failure to set your lineup is your own fault.
        </p>
        <p className="mt-4 border-t border-rule pt-3 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          {`\u00A9 ${year} Greybushes & Chili Dogs`}
        </p>
      </div>
    </footer>
  );
}
