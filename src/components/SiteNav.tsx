"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserMenu from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
}

/**
 * The masthead carries the league name; the rule below it carries navigation.
 * Primary items are the pages you land on weekly, the rest live under More.
 */
const PRIMARY_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings" },
  { href: "/matchups", label: "Matchups" },
  { href: "/teams", label: "Teams" },
  { href: "/draft", label: "Draft" },
  { href: "/records", label: "Records" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/stats", label: "Stats & Rankings" },
  { href: "/head-to-head", label: "Head-to-Head" },
  { href: "/history", label: "History" },
  { href: "/managers", label: "Managers" },
  { href: "/wall-of-shame", label: "Wall of Shame" },
  { href: "/payouts", label: "Payouts" },
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
  const moreRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const isMoreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <>
      {/* Masthead */}
      <header className="bg-night text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link
            href="/"
            data-testid="site-logo"
            className="flex items-baseline gap-3 transition-opacity hover:opacity-80"
          >
            <span className="font-[family-name:var(--wire-display)] text-[22px] font-extrabold uppercase leading-none tracking-[0.01em] lg:text-[26px]">
              Greybushes &amp; Chili Dogs
            </span>
            <span className="hidden font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-night-muted lg:inline">
              Est. 2015
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Section rule */}
      <nav
        className="sticky top-0 z-40 hidden border-b border-rule bg-surface lg:block"
        aria-label="Primary"
      >
        <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
          <ul className="flex items-center gap-1">
            {PRIMARY_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-[44px] items-center border-b-2 px-3 font-[family-name:var(--wire-display)] text-[15px] font-bold uppercase tracking-[0.03em] transition-colors ${
                      active
                        ? "border-result text-ink"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                className={`inline-flex min-h-[44px] items-center gap-1 border-b-2 px-3 font-[family-name:var(--wire-display)] text-[15px] font-bold uppercase tracking-[0.03em] transition-colors ${
                  isMoreActive
                    ? "border-result text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                More
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full z-50 w-56 border border-ink bg-surface">
                  {MORE_ITEMS.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block border-b border-rule px-4 py-2.5 font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.03em] transition-colors last:border-b-0 ${
                          active
                            ? "text-result"
                            : "text-ink-soft hover:bg-paper hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
