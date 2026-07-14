"use client";

import Link from "next/link";

interface HubZone {
  href: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  hoverColor: string;
}

const ZONES: HubZone[] = [
  {
    href: "/standings",
    label: "Scoreboard",
    sublabel: "Live standings",
    icon: "📊",
    color: "from-[#2C1810] to-[#1A0F08]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/matchups",
    label: "Matchups",
    sublabel: "This week's games",
    icon: "📋",
    color: "from-[#5C3A1E] to-[#3E2510]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/draft",
    label: "Draft Table",
    sublabel: "Board, history, trends",
    icon: "🃏",
    color: "from-[#2C1810] to-[#1A0F08]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/history",
    label: "Trophy Shelf",
    sublabel: "Hall of Champions",
    icon: "🏆",
    color: "from-[#5C3A1E] to-[#3E2510]",
    hoverColor: "hover:border-[#FFD700]",
  },
  {
    href: "/teams",
    label: "The Roster",
    sublabel: "Teams & managers",
    icon: "👕",
    color: "from-[#2C1810] to-[#1A0F08]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/records",
    label: "Record Book",
    sublabel: "Records & awards",
    icon: "📖",
    color: "from-[#2A4A3A] to-[#1E3A2E]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/stats",
    label: "Stats Board",
    sublabel: "Stats & power rankings",
    icon: "📈",
    color: "from-[#2A4A3A] to-[#1E3A2E]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/transactions",
    label: "Swap Meet",
    sublabel: "Trades & pickups",
    icon: "🤝",
    color: "from-[#5C3A1E] to-[#3E2510]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/records?tab=hall-of-shame",
    label: "Doghouse",
    sublabel: "Wall of Shame",
    icon: "🐕",
    color: "from-[#8B1A1A] to-[#5C1010]",
    hoverColor: "hover:border-[#C62828]",
  },
  {
    href: "/articles",
    label: "The Cookout",
    sublabel: "Articles & league info",
    icon: "🔥",
    color: "from-[#8B6914] to-[#5C3A0E]",
    hoverColor: "hover:border-[#FFD23F]",
  },
  {
    href: "/games",
    label: "Arcade",
    sublabel: "Mini-games",
    icon: "🕹️",
    color: "from-[#1565C0] to-[#0D47A1]",
    hoverColor: "hover:border-[#87CEEB]",
  },
  {
    href: "/managers",
    label: "Manager Cards",
    sublabel: "Career profiles",
    icon: "🎴",
    color: "from-[#2C1810] to-[#1A0F08]",
    hoverColor: "hover:border-[#FFD23F]",
  },
];

export default function BackyardHub() {
  return (
    <div className="relative">
      {/* Backyard scene background — placeholder for future AI illustration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {/* Sky gradient */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-[#5B9BD5] via-[#87CEEB] to-transparent" />
        {/* String lights */}
        <div className="absolute top-[20%] left-[5%] right-[5%] h-px bg-[#8B5E3C]/40" />
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        <div className="absolute top-[20%] left-[25%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        <div className="absolute top-[20%] left-[40%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        <div className="absolute top-[20%] left-[55%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        <div className="absolute top-[20%] left-[70%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        <div className="absolute top-[20%] left-[85%] w-2 h-2 rounded-full bg-[#FFE4B5] shadow-[0_0_8px_#FFE4B5]" />
        {/* Fence */}
        <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-[#8B5E3C] to-[#A0784C]" />
        <div className="absolute bottom-[15%] left-0 right-0 h-[2px] bg-[#5C3A1E]" />
      </div>

      {/* Hero title */}
      <div className="relative z-10 pt-12 pb-6 text-center">
        <p className="font-[family-name:var(--font-heading)] text-lg text-[#FFD23F] uppercase tracking-[0.3em] text-shadow-sm">
          Est. 2015
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-7xl text-[#F5F0E8] text-shadow-wood-lg leading-tight">
          Greybushes
          <span className="text-[#FFD23F]"> & </span>
          Chili Dogs
        </h1>
        <p className="mt-3 font-[family-name:var(--font-body)] text-sm sm:text-base text-[#F5F0E8]/70 font-semibold text-shadow-sm">
          A bunch of degenerates who claim to be extraordinary swindlers
        </p>
      </div>

      {/* Zone grid — the backyard navigation */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ZONES.map((zone) => (
            <Link
              key={zone.href}
              href={zone.href}
              className={`group relative overflow-hidden rounded-2xl border-[3px] border-[#8B5E3C] bg-gradient-to-br ${zone.color} p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 ${zone.hoverColor}`}
            >
              <span className="text-3xl sm:text-4xl block mb-3" aria-hidden>{zone.icon}</span>
              <h2 className="font-[family-name:var(--font-heading)] text-base sm:text-lg text-[#F5F0E8] uppercase tracking-wide text-shadow-sm">
                {zone.label}
              </h2>
              <p className="mt-1 font-[family-name:var(--font-body)] text-xs text-[#F5F0E8]/50 font-semibold">
                {zone.sublabel}
              </p>
              {/* Wood grain texture overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 4px)",
                }}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
