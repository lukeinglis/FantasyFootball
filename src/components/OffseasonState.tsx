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
        {/* There used to be a badge here reading "Yahoo API connected". We reach
            this state by failing to resolve a game key, which is what an
            offseason looks like but is not proof the feed is healthy. The badge
            was asserting something we had not checked, and it was doing it
            directly under a kickoff countdown during week two. */}
      </div>
    </div>
  );
}
