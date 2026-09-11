"use client";

export default function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-6 font-[family-name:var(--font-heading)] border border-record/40 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-record transition-all hover:bg-record/10 min-h-[44px]"
    >
      Try Again
    </button>
  );
}
