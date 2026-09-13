import type { CSSProperties } from "react";

interface MockNavProps {
  concept: {
    base: string;
    accent1: string;
    accent2: string;
    text: string;
    secondary: string;
    headingClass?: string;
    bodyClass?: string;
  };
  navStyle: CSSProperties;
  activeIndicatorStyle: CSSProperties;
}

const NAV_ITEMS = ["Home", "Standings", "Matchups", "Teams", "Draft"];

export default function MockNav({ concept, navStyle, activeIndicatorStyle }: MockNavProps) {
  return (
    <div style={navStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "auto" }}>
        <span
          className={concept.headingClass}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: concept.accent1,
            marginRight: "12px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          🏈 G&CD
        </span>
        {NAV_ITEMS.map((item, i) => (
          <span
            key={item}
            className={concept.bodyClass}
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              cursor: "default",
              color: i === 0 ? concept.text : concept.secondary,
              ...(i === 0 ? activeIndicatorStyle : {}),
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
