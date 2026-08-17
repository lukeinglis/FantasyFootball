"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  iconActive: string;
}

const TAB_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠", iconActive: "🏠" },
  { href: "/matchups", label: "Matchups", icon: "📋", iconActive: "📋" },
  { href: "/standings", label: "Standings", icon: "📊", iconActive: "📊" },
  { href: "/teams", label: "My Team", icon: "👕", iconActive: "👕" },
];

interface MoreItem {
  href: string;
  label: string;
  icon: string;
}

const MORE_ITEMS: MoreItem[] = [
  { href: "/draft", label: "Draft", icon: "🃏" },
  { href: "/stats", label: "Stats & Rankings", icon: "📈" },
  { href: "/records", label: "Record Book", icon: "📖" },
  { href: "/head-to-head", label: "Head-to-Head", icon: "⚔️" },
  { href: "/history", label: "History", icon: "🏆" },
  { href: "/managers", label: "Managers", icon: "🎴" },
  { href: "/transactions", label: "Transactions", icon: "🤝" },
  { href: "/league", label: "League Info", icon: "ℹ️" },
  { href: "/articles", label: "Articles", icon: "🔥" },
  { href: "/games", label: "Arcade", icon: "🕹️" },
];

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function isMoreActive(currentPath: string): boolean {
  return MORE_ITEMS.some((item) => isActive(currentPath, item.href));
}

export default function MobileNav() {
  const pathname = usePathname() ?? "/";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function handleResize() {
      const threshold = window.innerHeight * 0.75;
      setKeyboardVisible((vv?.height ?? window.innerHeight) < threshold);
    }

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  if (keyboardVisible) return null;

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        role="navigation"
        aria-label="Mobile navigation"
        data-testid="mobile-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[linear-gradient(0deg,#8B5E3C,#5C3A1E)] border-t-[3px] border-[#D4A847] shadow-[0_-4px_16px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around">
          {TAB_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center min-h-12 min-w-12 flex-1 py-1.5 transition-colors ${
                  active
                    ? "bg-[#DD550C] text-white shadow-[0_-2px_8px_rgba(221,85,12,0.4)]"
                    : "text-[#F5F0E8]/70 active:bg-white/10"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {active ? item.iconActive : item.icon}
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-wide mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            className={`flex flex-col items-center justify-center min-h-12 min-w-12 flex-1 py-1.5 transition-colors ${
              sheetOpen || isMoreActive(pathname)
                ? "bg-[#DD550C] text-white shadow-[0_-2px_8px_rgba(221,85,12,0.4)]"
                : "text-[#F5F0E8]/70 active:bg-white/10"
            }`}
          >
            <span className="text-lg" aria-hidden>
              ⋯
            </span>
            <span className="font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-wide mt-0.5">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Bottom sheet / drawer */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99] bg-black/60 md:hidden"
            onClick={closeSheet}
            aria-hidden
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-label="More navigation"
            data-testid="mobile-more-sheet"
            className="fixed bottom-0 left-0 right-0 z-[100] md:hidden rounded-t-2xl bg-[#2C1810] border-t-[3px] border-[#D4A847] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] pb-[env(safe-area-inset-bottom)] animate-[slide-up_0.25s_ease-out]"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-[#D4A847]/30" />
            </div>
            <div className="px-4 pb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-xs uppercase tracking-[0.2em] text-[#D4A847] mb-3">
                More
              </h2>
              <ul className="grid grid-cols-2 gap-2">
                {MORE_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 min-h-12 px-3 py-2.5 rounded-lg transition-colors ${
                          active
                            ? "bg-[#DD550C]/15 text-[#FFD23F]"
                            : "text-[#F5F0E8] hover:bg-white/8 active:bg-white/12"
                        }`}
                      >
                        <span className="text-lg" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="font-[family-name:var(--font-body)] font-extrabold text-xs uppercase tracking-widest">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Extra padding to clear the tab bar */}
            <div className="h-16" />
          </div>
        </>
      )}
    </>
  );
}
