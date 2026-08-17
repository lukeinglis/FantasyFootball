"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserMenu from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
}

const PRIMARY_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings" },
  { href: "/matchups", label: "Matchups" },
  { href: "/teams", label: "Teams" },
  { href: "/draft", label: "Draft" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/stats", label: "Stats & Rankings" },
  { href: "/records", label: "Record Book" },
  { href: "/head-to-head", label: "Head-to-Head" },
  { href: "/history", label: "History" },
  { href: "/managers", label: "Managers" },
  { href: "/transactions", label: "Transactions" },
  { href: "/league", label: "League Info" },
  { href: "/articles", label: "Articles" },
  { href: "/games", label: "Arcade" },
];

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname() ?? "/";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isMoreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-40 bg-[linear-gradient(180deg,#8B5E3C,#5C3A1E)] border-b-4 border-[#D4A847] shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          data-testid="site-logo"
          className="flex items-center gap-2 text-[#FFD23F] hover:text-[#FFD23F]/80 transition-colors"
        >
          <span aria-hidden className="text-xl">🏈</span>
          <span
            className="font-[family-name:var(--font-heading)] text-base sm:text-lg tracking-wide text-shadow-logo"
          >
            Greybushes <span className="text-[#F5F0E8]/70">&amp;</span> Chili Dogs
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {PRIMARY_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 rounded-md font-[family-name:var(--font-body)] font-extrabold text-xs uppercase tracking-widest transition-all ${
                  active
                    ? "bg-[#DD550C] text-white shadow-[0_2px_8px_rgba(221,85,12,0.4)]"
                    : "text-[#F5F0E8] hover:bg-white/12 hover:text-[#FFD23F] hover:-translate-y-px"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={`px-3 py-2 rounded-md font-[family-name:var(--font-body)] font-extrabold text-xs uppercase tracking-widest transition-all inline-flex items-center gap-1 ${
                isMoreActive
                  ? "bg-[#DD550C] text-white shadow-[0_2px_8px_rgba(221,85,12,0.4)]"
                  : "text-[#F5F0E8] hover:bg-white/12 hover:text-[#FFD23F] hover:-translate-y-px"
              }`}
            >
              More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#D4A847]/20 bg-[#5C3A1E] py-1 shadow-xl shadow-black/40">
                {MORE_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 font-[family-name:var(--font-body)] font-extrabold text-xs uppercase tracking-widest transition-colors ${
                        active
                          ? "bg-[#DD550C]/10 text-[#FFD23F] font-medium"
                          : "text-[#F5F0E8] hover:bg-white/12 hover:text-[#FFD23F]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ml-2 border-l border-[#D4A847]/20 pl-3">
            <UserMenu />
          </div>
        </nav>

        {/* Desktop user menu (hidden on mobile where MobileNav handles navigation) */}
        <div className="hidden md:flex lg:hidden items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
