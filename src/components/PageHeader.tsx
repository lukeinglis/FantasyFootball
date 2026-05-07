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
    <div className="border-b border-white/10 bg-gradient-to-b from-[#1a3155] to-[#0f1f3a]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]/80">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-gray-300">
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
