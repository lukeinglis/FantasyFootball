import type { ReactNode } from "react";

interface MobilePreviewProps {
  children: ReactNode;
  bgColor: string;
  textColor: string;
}

export default function MobilePreview({ children, bgColor, textColor }: MobilePreviewProps) {
  return (
    <div style={{ maxWidth: "100%" }}>
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: textColor,
          opacity: 0.5,
          marginBottom: "8px",
          fontFamily: "monospace",
        }}
      >
        Mobile Preview — 375px
      </div>
      <div
        style={{
          width: "375px",
          maxWidth: "100%",
          border: "2px solid rgba(128,128,128,0.3)",
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: bgColor,
        }}
      >
        <div
          style={{
            height: "24px",
            backgroundColor: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "rgba(128,128,128,0.4)",
            }}
          />
        </div>
        <div style={{ padding: "0" }}>{children}</div>
        <div style={{ height: "16px" }} />
      </div>
    </div>
  );
}
