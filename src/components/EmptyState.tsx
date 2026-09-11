import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * An empty section is still a section, so it keeps the hairline frame instead of
 * becoming a hole in the page. The `icon` prop is accepted for compatibility but
 * not rendered: the old call sites pass emoji, which the Wire does not use.
 */
export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="border border-rule bg-surface px-6 py-10 text-center">
      <h3 className="font-[family-name:var(--wire-display)] text-[17px] font-extrabold uppercase tracking-[0.06em] text-ink">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-2 max-w-[52ch] font-[family-name:var(--wire-body)] text-[14px] leading-[1.5] text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
