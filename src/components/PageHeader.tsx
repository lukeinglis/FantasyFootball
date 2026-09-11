interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  pennant?: string;
  children?: React.ReactNode;
}

/**
 * A section front, not a hero. The kicker sits above the headline, which runs
 * at newspaper scale, and the standfirst is set in the serif because it is a
 * sentence rather than a label. `pennant` and `eyebrow` were separate devices
 * in the old theme; both are kickers, so they run on one line separated by a
 * middot rather than stacking into two thin strips.
 */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  pennant,
  children,
}: PageHeaderProps) {
  const kickers = [eyebrow, pennant].filter(Boolean) as string[];

  return (
    <div className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {kickers.length > 0 && (
              <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-result">
                {kickers.join(" \u00B7 ")}
              </p>
            )}
            <h1
              data-testid="page-title"
              className="mt-1 font-[family-name:var(--wire-display)] text-[34px] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink sm:text-[44px]"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-[62ch] font-[family-name:var(--wire-body)] text-[15px] leading-[1.5] text-ink-soft">
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
