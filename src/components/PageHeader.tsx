interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#183558] via-[#112d4e] to-[#0C2340]">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#DD550C]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#DD550C]/80">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm text-gray-300 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="flex-shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  );
}
