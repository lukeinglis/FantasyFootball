import type { CSSProperties } from "react";
import ContrastBadge from "./ContrastBadge";

interface MockCardProps {
  concept: {
    base: string;
    surface: string;
    accent1: string;
    accent2: string;
    accent3: string;
    text: string;
    secondary: string;
    border: string;
    accentBorder: string;
    displayFont: string;
    headingFont: string;
    bodyFont: string;
    displayClass?: string;
    headingClass?: string;
    bodyClass?: string;
  };
  cardStyle: CSSProperties;
}

export default function MockCard({ concept, cardStyle }: MockCardProps) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: `1px solid ${concept.border}`,
          padding: "12px 16px",
        }}
      >
        <span
          className={concept.headingClass}
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: concept.accent1,
            fontWeight: 700,
          }}
        >
          Season Leader
        </span>
        <span
          style={{
            fontSize: "10px",
            color: concept.secondary,
            fontFamily: "monospace",
          }}
        >
          2025
        </span>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
          <span
            className={concept.displayClass}
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: concept.text,
              lineHeight: 1,
            }}
          >
            1,847
          </span>
          <span
            className={concept.bodyClass}
            style={{ fontSize: "13px", color: concept.secondary }}
          >
            pts
          </span>
        </div>
        <div
          className={concept.bodyClass}
          style={{ fontSize: "14px", color: concept.text, marginBottom: "4px" }}
        >
          Luke &ldquo;The Algorithm&rdquo; I.
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "9999px",
              backgroundColor: `${concept.accent2}20`,
              color: concept.accent2,
              fontWeight: 700,
            }}
          >
            12-2 Record
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "9999px",
              backgroundColor: `${concept.accent1}20`,
              color: concept.accent1,
              fontWeight: 600,
            }}
          >
            #1 Rank
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: `1px solid ${concept.border}`,
          }}
        >
          <ContrastBadge fg={concept.text} bg={concept.surface} label="Body" />
          <ContrastBadge fg={concept.secondary} bg={concept.surface} label="Muted" />
          <ContrastBadge fg={concept.accent1} bg={concept.surface} label="Accent" />
        </div>
      </div>
    </div>
  );
}
