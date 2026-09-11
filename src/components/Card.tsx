import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  variant?: "default" | "glass" | "scoreboard" | "chalkboard" | "trading-card";
}

/**
 * The variant names are inherited from the previous theme and kept so the ~30
 * pages that pass them keep compiling, but in the Wire they all resolve to the
 * same paper surface. The distinction that used to be carried by texture is now
 * carried by rule weight and heading, so the variants converge rather than
 * multiply. `chalkboard` in particular must not be a night panel: its call
 * sites set their own ink-coloured text, which would be invisible on dark.
 */
const variantStyles: Record<string, string> = {
  scoreboard: "border border-rule bg-surface",
  chalkboard: "border border-rule bg-surface",
  "trading-card":
    "border border-rule bg-surface transition-colors hover:border-ink",
};

variantStyles.default = variantStyles.scoreboard;
variantStyles.glass = variantStyles.scoreboard;

export function Card({
  children,
  className = "",
  as = "div",
  variant = "default",
}: CardProps) {
  const Tag = as;
  const base = variantStyles[variant] ?? variantStyles.default;

  return <Tag className={`${base} ${className}`}>{children}</Tag>;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "scoreboard" | "chalkboard" | "trading-card";
}

export function CardHeader({
  title,
  description,
  action,
  variant = "scoreboard",
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink px-4 py-3">
      <div className="min-w-0">
        <h2 className="font-[family-name:var(--wire-display)] text-[15px] font-extrabold uppercase tracking-[0.08em] text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
  variant?: "scoreboard" | "chalkboard" | "trading-card";
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div className={`px-4 py-3 text-ink-soft ${className}`}>{children}</div>
  );
}
