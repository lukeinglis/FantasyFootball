// ============================================================
// Numeric/string formatters with edge-case handling
// All input may come from external APIs; sanitize aggressively.
// ============================================================

/** Returns true if a value is a finite, real number. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Coerce to a finite number or fall back. Handles NaN, Infinity, null. */
export function toFiniteNumber(value: unknown, fallback = 0): number {
  if (isFiniteNumber(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** Format a points value, handling NaN/Infinity/null. */
export function formatPoints(
  value: number | null | undefined,
  digits = 2
): string {
  if (value === null || value === undefined) return "—";
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

/** Format an integer count safely. */
export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (!Number.isFinite(value)) return "—";
  return Math.trunc(value).toString();
}

/** Format a record like W-L or W-L-T. */
export function formatRecord(
  wins: number | null | undefined,
  losses: number | null | undefined,
  ties: number | null | undefined
): string {
  const w = toFiniteNumber(wins, 0);
  const l = toFiniteNumber(losses, 0);
  const t = toFiniteNumber(ties, 0);
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

/** Format a percentage 0..1 as "XX.X%". Returns "—" for invalid. */
export function formatPercent(
  value: number | null | undefined,
  digits = 1
): string {
  if (value === null || value === undefined) return "—";
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

/** Format a unix-ms or unix-seconds timestamp as a localized date. */
export function formatTimestamp(ts: number | null | undefined): string {
  if (ts === null || ts === undefined || !Number.isFinite(ts)) return "—";
  // Treat anything < 10^12 as seconds, else ms.
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Capitalize a single word. */
export function titleCase(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

/** Format a USD currency value. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
