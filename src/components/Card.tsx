import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  variant?: "default" | "glass";
}

export function Card({
  children,
  className = "",
  as = "div",
  variant = "default",
}: CardProps) {
  const Tag = as;
  const base =
    variant === "glass"
      ? "glass rounded-2xl shadow-lg shadow-black/25"
      : "rounded-2xl border border-white/10 bg-[#112d4e] shadow-lg shadow-black/25";
  return (
    <Tag
      className={`${base} transition-all duration-300 hover:border-[#DD550C]/20 hover:shadow-xl hover:shadow-[#DD550C]/5 ${className}`}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold uppercase tracking-wide text-[#DD550C]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
