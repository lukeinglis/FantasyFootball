interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  pennant?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  pennant,
  children,
}: PageHeaderProps) {
  return (
    <div className="relative py-12 sm:py-16">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {pennant && (
              <div
                className="mb-3 inline-block bg-[#C62828] px-6 py-1.5 font-[family-name:var(--font-heading)] text-sm uppercase tracking-widest text-[#F5F0E8] [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)]"
                style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}
              >
                {pennant}
              </div>
            )}
            {eyebrow && (
              <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
                {eyebrow}
              </p>
            )}
            <h1
              data-testid="page-title"
              className="mt-1 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#F5F0E8] sm:text-5xl"
              style={{ textShadow: "3px 3px 0 #5C3A1E, 0 0 20px rgba(0,0,0,0.3)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2 max-w-2xl font-[family-name:var(--font-body)] text-sm font-semibold text-[rgba(245,240,232,0.7)] sm:text-base"
                style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}
              >
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
