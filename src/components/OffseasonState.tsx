interface OffseasonStateProps {
  resource: string;
}

export default function OffseasonState({ resource }: OffseasonStateProps) {
  return (
    <div className="relative overflow-hidden border border-record/20 bg-surface px-6 py-10 text-center">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative">
        <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase tracking-wide text-ink">
          Countdown to Kickoff
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          Live {resource} data will be available once the new NFL season kicks off.
        </p>
        {/* Connection state, not an alert. A pulsing dot on a red wash read as
            a warning about the very thing it was confirming was fine. */}
        <div className="mt-4 inline-flex items-center gap-2 border border-rule bg-paper px-3 py-1.5">
          <span className="h-1.5 w-1.5 flex-shrink-0 bg-record" />
          <span className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Yahoo API connected
          </span>
        </div>
      </div>
    </div>
  );
}
