import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  variant?: "default" | "glass" | "scoreboard" | "chalkboard" | "trading-card";
}

const variantStyles: Record<string, string> = {
  scoreboard: [
    "relative overflow-hidden rounded-xl border-[3px] border-[#D4A847]",
    "bg-[linear-gradient(180deg,#2C1810,#1A0F08)]",
    "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
  ].join(" "),
  chalkboard: [
    "relative rounded-lg border-[3px] border-[#8B5E3C]",
    "bg-[#2A4A3A]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_0_30px_rgba(0,0,0,0.2)]",
  ].join(" "),
  "trading-card": [
    "relative overflow-hidden rounded-xl border-[3px] border-[#A0784C]",
    "bg-[linear-gradient(145deg,#FFFBF0,#F0E8D8)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.25)]",
    "transition-all duration-200",
    "hover:translate-y-[-4px] hover:rotate-[-1deg] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
  ].join(" "),
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

  return (
    <Tag className={`${base} ${className}`}>
      {variant === "scoreboard" || variant === "default" || variant === "glass" ? (
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,transparent,#D4A847_20%,#D4A847_80%,transparent)]"
          aria-hidden
        />
      ) : null}
      {children}
    </Tag>
  );
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
  const titleColor =
    variant === "chalkboard"
      ? "text-[#F5F0E8]"
      : variant === "trading-card"
        ? "text-[#2C1810]"
        : "text-[#D4A847]";

  const descColor =
    variant === "trading-card" ? "text-[#6B5744]" : "text-[rgba(245,240,232,0.5)]";

  const borderColor =
    variant === "trading-card"
      ? "border-[#A0784C]/20"
      : variant === "chalkboard"
        ? "border-[#8B5E3C]/30"
        : "border-[#D4A847]/20";

  return (
    <div
      className={`flex items-start justify-between gap-3 border-b ${borderColor} px-5 py-4`}
    >
      <div>
        <h2
          className={`font-[family-name:var(--font-heading)] text-lg uppercase tracking-widest ${titleColor}`}
          style={
            variant === "scoreboard"
              ? { textShadow: "0 0 8px rgba(212,168,71,0.3)" }
              : variant === "chalkboard"
                ? { textShadow: "0 0 4px rgba(245,240,232,0.2)" }
                : undefined
          }
        >
          {title}
        </h2>
        {description && (
          <p className={`mt-1 text-xs ${descColor}`}>{description}</p>
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

export function CardBody({
  children,
  className = "",
  variant = "scoreboard",
}: CardBodyProps) {
  const textColor =
    variant === "trading-card"
      ? "text-[#3E2B1C]"
      : variant === "chalkboard"
        ? "text-[rgba(245,240,232,0.85)]"
        : "text-[#F5F0E8]";

  return (
    <div className={`px-5 py-4 ${textColor} ${className}`}>{children}</div>
  );
}
