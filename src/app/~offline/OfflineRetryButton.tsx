"use client";

export default function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-6 font-[family-name:var(--font-heading)] rounded-lg border border-[#D4A847]/40 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#D4A847] transition-all hover:bg-[#D4A847]/10 min-h-[44px]"
    >
      Try Again
    </button>
  );
}
