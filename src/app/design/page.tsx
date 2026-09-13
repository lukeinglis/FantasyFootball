"use client";

import { useState } from "react";
import { Bebas_Neue, Oswald, Nunito, Fjalla_One, Montagu_Slab, Syne, DM_Sans, Playfair_Display, Source_Sans_3 } from "next/font/google";
import ConceptShowcase from "@/components/design/ConceptShowcase";
import type { ConceptDef } from "@/components/design/ConceptShowcase";

const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap" });
const fjallaOne = Fjalla_One({ subsets: ["latin"], weight: "400", display: "swap" });
const montaguSlab = Montagu_Slab({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

const concepts: ConceptDef[] = [
  {
    id: "a",
    name: "Midnight Gridiron",
    tagline: "Dark sports dashboard — data-dense and electric",
    personality: "Modern scoreboard app. Like Sleeper meets a Bloomberg terminal for fantasy.",
    base: "#09090B",
    surface: "#18181B",
    muted: "#27272A",
    accent1: "#3B82F6",
    accent2: "#84CC16",
    accent3: "#EF4444",
    text: "#F4F4F5",
    secondary: "#A1A1AA",
    border: "#3F3F46",
    accentBorder: "#3B82F6",
    displayFont: "Bebas Neue",
    headingFont: "Oswald",
    bodyFont: "Nunito",
    displayClass: bebasNeue.className,
    headingClass: oswald.className,
    bodyClass: nunito.className,
    colors: [
      { hex: "#09090B", name: "Base" },
      { hex: "#18181B", name: "Surface" },
      { hex: "#27272A", name: "Muted" },
      { hex: "#3B82F6", name: "Blue" },
      { hex: "#84CC16", name: "Lime" },
      { hex: "#EF4444", name: "Red" },
      { hex: "#F4F4F5", name: "Text" },
      { hex: "#A1A1AA", name: "Secondary" },
    ],
    cardStyle: {
      backgroundColor: "#18181B",
      borderRadius: "12px",
      border: "1px solid #3F3F46",
      backdropFilter: "blur(12px)",
      boxShadow: "0 0 0 1px rgba(59,130,246,0.1), 0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
    },
    navStyle: {
      backgroundColor: "rgba(24,24,27,0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #3F3F46",
      padding: "8px 12px",
      borderRadius: "8px",
    },
    activeIndicatorStyle: {
      backgroundColor: "rgba(59,130,246,0.15)",
      borderBottom: "2px solid #3B82F6",
      color: "#F4F4F5",
    },
  },
  {
    id: "b",
    name: "Vintage Press Box",
    tagline: "Retro newspaper — bold headlines and ink-black type",
    personality: "\"EXTRA! EXTRA!\" Old-school sports section. Your league is front-page news.",
    base: "#FFFBF0",
    surface: "#F5EDE0",
    muted: "#EDE4D4",
    accent1: "#1A1A1A",
    accent2: "#C41E3A",
    accent3: "#B8860B",
    text: "#1A1A1A",
    secondary: "#6B5B4A",
    border: "#D4C5A9",
    accentBorder: "#1A1A1A",
    displayFont: "Fjalla One",
    headingFont: "Bebas Neue",
    bodyFont: "Nunito",
    displayClass: fjallaOne.className,
    headingClass: bebasNeue.className,
    bodyClass: nunito.className,
    colors: [
      { hex: "#FFFBF0", name: "Cream" },
      { hex: "#F5EDE0", name: "Paper" },
      { hex: "#EDE4D4", name: "Aged" },
      { hex: "#1A1A1A", name: "Ink" },
      { hex: "#C41E3A", name: "Press Red" },
      { hex: "#B8860B", name: "Gold" },
      { hex: "#6B5B4A", name: "Aged Ink" },
      { hex: "#D4C5A9", name: "Edge" },
    ],
    cardStyle: {
      backgroundColor: "#F5EDE0",
      borderRadius: "4px",
      borderTop: "4px solid #1A1A1A",
      border: "1px solid #D4C5A9",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    navStyle: {
      backgroundColor: "#FFFBF0",
      borderBottom: "3px solid #1A1A1A",
      padding: "8px 12px",
      borderRadius: "4px",
    },
    activeIndicatorStyle: {
      backgroundColor: "rgba(196,30,58,0.1)",
      borderBottom: "2px solid #C41E3A",
      color: "#1A1A1A",
    },
  },
  {
    id: "c",
    name: "Neon Sideline",
    tagline: "Bold and vibrant — personality-first design",
    personality: "Friday Night Lights energy. Bold, unapologetic, your league is the main event.",
    base: "#0F172A",
    surface: "#1E293B",
    muted: "#334155",
    accent1: "#F97316",
    accent2: "#FACC15",
    accent3: "#06B6D4",
    text: "#F1F5F9",
    secondary: "#94A3B8",
    border: "#475569",
    accentBorder: "#F97316",
    displayFont: "Montagu Slab",
    headingFont: "Syne",
    bodyFont: "DM Sans",
    displayClass: montaguSlab.className,
    headingClass: syne.className,
    bodyClass: dmSans.className,
    colors: [
      { hex: "#0F172A", name: "Navy" },
      { hex: "#1E293B", name: "Surface" },
      { hex: "#334155", name: "Muted" },
      { hex: "#F97316", name: "Orange" },
      { hex: "#FACC15", name: "Yellow" },
      { hex: "#06B6D4", name: "Cyan" },
      { hex: "#F1F5F9", name: "Text" },
      { hex: "#94A3B8", name: "Slate" },
    ],
    cardStyle: {
      backgroundColor: "#1E293B",
      borderRadius: "12px",
      border: "1px solid transparent",
      backgroundClip: "padding-box",
      boxShadow: "0 0 0 1px #475569, 0 0 0 2px rgba(249,115,22,0.3), 0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
    },
    navStyle: {
      backgroundColor: "#0F172A",
      borderBottom: "2px solid #475569",
      boxShadow: "0 2px 12px rgba(249,115,22,0.1)",
      padding: "8px 12px",
      borderRadius: "8px",
    },
    activeIndicatorStyle: {
      backgroundColor: "rgba(249,115,22,0.15)",
      boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
      borderBottom: "2px solid #F97316",
      color: "#F1F5F9",
    },
  },
  {
    id: "d",
    name: "The Lodge",
    tagline: "Warm premium trophy room — brass, leather, and history",
    personality: "The clubhouse after the game. Leather chairs, championship plaques. Your league has history.",
    base: "#1C1410",
    surface: "#2A1F17",
    muted: "#3D2E22",
    accent1: "#D4A847",
    accent2: "#C4956A",
    accent3: "#8B2500",
    text: "#F5EDE0",
    secondary: "#B8A690",
    border: "#4A3728",
    accentBorder: "#D4A847",
    displayFont: "Playfair Display",
    headingFont: "Source Sans 3",
    bodyFont: "Nunito",
    displayClass: playfairDisplay.className,
    headingClass: sourceSans3.className,
    bodyClass: nunito.className,
    colors: [
      { hex: "#1C1410", name: "Walnut" },
      { hex: "#2A1F17", name: "Leather" },
      { hex: "#3D2E22", name: "Warm" },
      { hex: "#D4A847", name: "Brass" },
      { hex: "#C4956A", name: "Tan" },
      { hex: "#8B2500", name: "Burgundy" },
      { hex: "#F5EDE0", name: "Cream" },
      { hex: "#B8A690", name: "Muted" },
    ],
    cardStyle: {
      backgroundColor: "#2A1F17",
      borderRadius: "12px",
      border: "1px solid #4A3728",
      boxShadow: "inset 0 1px 0 rgba(212,168,71,0.15), 0 8px 32px rgba(0,0,0,0.4)",
      overflow: "hidden",
    },
    navStyle: {
      backgroundColor: "#1C1410",
      borderBottom: "1px solid #4A3728",
      boxShadow: "0 2px 12px rgba(212,168,71,0.05)",
      padding: "8px 12px",
      borderRadius: "8px",
    },
    activeIndicatorStyle: {
      backgroundColor: "rgba(212,168,71,0.1)",
      borderBottom: "2px solid #D4A847",
      color: "#F5EDE0",
    },
  },
];

const CONCEPT_LABELS = [
  { id: "a", label: "A", name: "Midnight Gridiron" },
  { id: "b", label: "B", name: "Vintage Press Box" },
  { id: "c", label: "C", name: "Neon Sideline" },
  { id: "d", label: "D", name: "The Lodge" },
];

export default function DesignPage() {
  const [activeId, setActiveId] = useState("a");
  const activeConcept = concepts.find((c) => c.id === activeId)!;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "#eee",
      }}
    >
      {/* Sticky concept toggle */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(17,17,17,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px", fontFamily: "monospace" }}>
            Design Exploration — Issue #32
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {CONCEPT_LABELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: activeId === c.id ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: activeId === c.id ? "rgba(255,255,255,0.15)" : "transparent",
                  color: activeId === c.id ? "#fff" : "#999",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: activeId === c.id ? 700 : 400,
                  transition: "all 0.15s ease",
                  minHeight: "44px",
                }}
              >
                <span style={{ fontWeight: 700 }}>{c.label}</span>
                <span style={{ marginLeft: "6px", fontSize: "11px" }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active concept */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 0 48px" }}>
        <ConceptShowcase concept={activeConcept} />
      </div>
    </div>
  );
}
