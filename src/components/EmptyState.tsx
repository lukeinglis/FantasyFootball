import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#112d4e]/40 px-6 py-12 text-center">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div className="relative">
        {icon && (
          <div className="mb-4 text-4xl text-[#DD550C]" aria-hidden>
            {icon}
          </div>
        )}
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold uppercase tracking-wide text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-2 max-w-md mx-auto text-sm text-gray-400">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
