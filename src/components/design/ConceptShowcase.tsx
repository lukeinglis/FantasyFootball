import type { CSSProperties } from "react";
import ColorPalette from "./ColorPalette";
import FontSample from "./FontSample";
import MockCard from "./MockCard";
import MockNav from "./MockNav";
import MobilePreview from "./MobilePreview";

export interface ConceptDef {
  id: string;
  name: string;
  tagline: string;
  personality: string;
  base: string;
  surface: string;
  muted: string;
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
  cardStyle: CSSProperties;
  navStyle: CSSProperties;
  activeIndicatorStyle: CSSProperties;
  colors: { hex: string; name: string }[];
}

interface ConceptShowcaseProps {
  concept: ConceptDef;
}

export default function ConceptShowcase({ concept }: ConceptShowcaseProps) {
  const sectionStyle: CSSProperties = {
    backgroundColor: concept.base,
    borderRadius: "16px",
    padding: "24px",
    border: `1px solid ${concept.border}`,
  };

  const headingStyle: CSSProperties = {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: concept.accent1,
    marginBottom: "16px",
    fontWeight: 700,
    fontFamily: "monospace",
  };

  return (
    <div style={{ backgroundColor: concept.base, color: concept.text }}>
      {/* Header */}
      <div style={{ padding: "32px 24px 24px", textAlign: "center" }}>
        <h2
          className={concept.displayClass}
          style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}
        >
          {concept.name}
        </h2>
        <p
          className={concept.bodyClass}
          style={{ fontSize: "16px", color: concept.secondary, maxWidth: "480px", margin: "0 auto" }}
        >
          {concept.tagline}
        </p>
        <p
          className={concept.bodyClass}
          style={{
            fontSize: "13px",
            color: concept.secondary,
            marginTop: "8px",
            fontStyle: "italic",
            opacity: 0.8,
          }}
        >
          {concept.personality}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "24px",
          padding: "0 24px 24px",
          gridTemplateColumns: "1fr",
        }}
      >
        {/* Color Palette */}
        <div style={sectionStyle}>
          <div style={headingStyle}>Color Palette</div>
          <ColorPalette colors={concept.colors} textColor={concept.secondary} />
        </div>

        {/* Typography */}
        <div style={sectionStyle}>
          <div style={headingStyle}>Typography</div>
          <FontSample
            label="Display"
            fontFamily={concept.displayFont}
            className={concept.displayClass}
            textColor={concept.text}
            secondaryColor={concept.secondary}
            samples={[
              { text: "GREYBUSHES & CHILI DOGS", size: "28px", weight: 700 },
              { text: "Season Champions 2025", size: "22px" },
            ]}
          />
          <FontSample
            label="Heading"
            fontFamily={concept.headingFont}
            className={concept.headingClass}
            textColor={concept.text}
            secondaryColor={concept.secondary}
            samples={[
              { text: "POWER RANKINGS · WEEK 14", size: "16px", weight: 700 },
              { text: "TOTAL POINTS · WIN STREAK · PLAYOFF ODDS", size: "12px", weight: 600 },
            ]}
          />
          <FontSample
            label="Body"
            fontFamily={concept.bodyFont}
            className={concept.bodyClass}
            textColor={concept.text}
            secondaryColor={concept.secondary}
            samples={[
              { text: "Luke dominated the regular season with a league-high 1,847 points, securing the #1 seed heading into the playoffs.", size: "14px" },
              { text: "Roster: QB · RB · RB · WR · WR · TE · FLEX · K · DEF", size: "12px" },
            ]}
          />
        </div>

        {/* Two-column layout for card + nav on larger screens */}
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {/* Mock Stat Card */}
          <div style={sectionStyle}>
            <div style={headingStyle}>Stat Card</div>
            <MockCard concept={concept} cardStyle={concept.cardStyle} />
          </div>

          {/* Mock Nav Bar */}
          <div style={sectionStyle}>
            <div style={headingStyle}>Navigation</div>
            <MockNav
              concept={concept}
              navStyle={concept.navStyle}
              activeIndicatorStyle={concept.activeIndicatorStyle}
            />
          </div>
        </div>

        {/* Mobile Preview */}
        <div style={sectionStyle}>
          <div style={headingStyle}>Mobile Preview</div>
          <MobilePreview bgColor={concept.base} textColor={concept.text}>
            <MockNav
              concept={concept}
              navStyle={{ ...concept.navStyle, borderRadius: 0 }}
              activeIndicatorStyle={concept.activeIndicatorStyle}
            />
            <div style={{ padding: "12px" }}>
              <MockCard concept={concept} cardStyle={concept.cardStyle} />
            </div>
          </MobilePreview>
        </div>
      </div>
    </div>
  );
}
