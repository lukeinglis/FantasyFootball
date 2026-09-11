"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface NavItem {
  href: string;
  label: string;
}

/**
 * The Wire sets navigation in type, not icons. Emoji glyphs render differently
 * on every platform and carry no information the label doesn't already give,
 * so the tab bar is condensed uppercase text with a red rule marking position.
 */
const TAB_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/matchups", label: "Matchups" },
  { href: "/standings", label: "Table" },
  { href: "/records", label: "Records" },
];

const MORE_ITEMS: NavItem[] = [
  { href: "/teams", label: "Teams" },
  { href: "/draft", label: "Draft" },
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

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  if (keyboardVisible) return null;

  const tabClass = (active: boolean) =>
    `flex min-h-[52px] flex-1 flex-col items-center justify-center border-t-2 px-1 font-[family-name:var(--wire-display)] text-[12px] font-bold uppercase tracking-[0.04em] transition-colors ${
      active
        ? "border-result text-white"
        : "border-transparent text-night-muted active:text-white"
    }`;

  return (
    <>
      <nav
        role="navigation"
        aria-label="Mobile navigation"
        data-testid="mobile-nav"
        className="fixed bottom-0 left-0 right-0 z-50 bg-night pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="flex items-stretch justify-around">
          {TAB_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={tabClass(active)}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            className={tabClass(sheetOpen || isMoreActive(pathname))}
          >
            More
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-[99] bg-ink/50 md:hidden"
            onClick={closeSheet}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="More navigation"
            data-testid="mobile-more-sheet"
            className="fixed bottom-0 left-0 right-0 z-[100] max-h-[75vh] overflow-y-auto bg-surface pb-[env(safe-area-inset-bottom)] md:hidden animate-[slide-up_0.2s_ease-out]"
          >
            <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
              <h2 className="font-[family-name:var(--wire-display)] text-[13px] font-extrabold uppercase tracking-[0.1em]">
                More
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                className="min-h-[44px] px-2 font-[family-name:var(--wire-mono)] text-[11px] uppercase tracking-[0.1em] text-ink-muted"
              >
                Close
              </button>
            </div>
            <ul>
              {MORE_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[48px] items-center border-b border-rule px-4 font-[family-name:var(--wire-display)] text-[15px] font-bold uppercase tracking-[0.03em] transition-colors ${
                        active ? "text-result" : "text-ink-soft active:bg-paper"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="h-16" />
          </div>
        </>
      )}
    </>
  );
}
