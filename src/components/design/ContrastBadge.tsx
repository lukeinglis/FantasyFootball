"use client";

function sRGBtoLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastBadgeProps {
  fg: string;
  bg: string;
  label?: string;
}

export default function ContrastBadge({ fg, bg, label }: ContrastBadgeProps) {
  const ratio = contrastRatio(fg, bg);
  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;

  const level = passAAA ? "AAA" : passAA ? "AA" : "Fail";
  const badgeColor = passAAA ? "#22c55e" : passAA ? "#84cc16" : "#ef4444";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        fontFamily: "monospace",
        padding: "2px 6px",
        borderRadius: "4px",
        border: `1px solid ${badgeColor}`,
        color: badgeColor,
        backgroundColor: `${badgeColor}15`,
      }}
    >
      {label && <span style={{ opacity: 0.7 }}>{label}</span>}
      <span style={{ fontWeight: 700 }}>{ratio.toFixed(1)}:1</span>
      <span
        style={{
          fontWeight: 700,
          backgroundColor: badgeColor,
          color: passAA ? "#000" : "#fff",
          padding: "0 4px",
          borderRadius: "2px",
          fontSize: "10px",
        }}
      >
        {level}
      </span>
    </span>
  );
}
