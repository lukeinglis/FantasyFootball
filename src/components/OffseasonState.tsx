interface OffseasonStateProps {
  resource: string;
}

export default function OffseasonState({ resource }: OffseasonStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1c30] to-[#112d4e] px-6 py-10 text-center">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative">
        <div className="mb-4 text-5xl" aria-hidden>
          🏈
        </div>
        <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase tracking-wide text-white">
          Countdown to Kickoff
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-400">
          Live {resource} data will be available once the new NFL season kicks off.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#DD550C]/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-gray-300">
            Yahoo API Connected
          </span>
        </div>
      </div>
    </div>
  );
}
