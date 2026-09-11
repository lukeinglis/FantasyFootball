import type { CSSProperties } from "react";

interface FontSampleProps {
  label: string;
  fontFamily: string;
  className?: string;
  textColor: string;
  secondaryColor: string;
  samples: { text: string; size: string; weight?: number }[];
}

export default function FontSample({
  label,
  fontFamily,
  className,
  textColor,
  secondaryColor,
  samples,
}: FontSampleProps) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: secondaryColor,
          marginBottom: "4px",
          fontFamily: "monospace",
        }}
      >
        {label} — {fontFamily}
      </div>
      {samples.map((s, i) => {
        const style: CSSProperties = {
          fontSize: s.size,
          fontWeight: s.weight ?? 400,
          color: textColor,
          lineHeight: 1.2,
          marginBottom: "4px",
        };
        return (
          <div key={i} className={className} style={style}>
            {s.text}
          </div>
        );
      })}
    </div>
  );
}
