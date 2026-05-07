"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings" },
  { href: "/matchups", label: "Matchups" },
  { href: "/teams", label: "Teams" },
  { href: "/draft", label: "Draft" },
  { href: "/transactions", label: "Transactions" },
  { href: "/records", label: "Records" },
  { href: "/history", label: "History" },
  { href: "/wall-of-shame", label: "Wall of Shame" },
  { href: "/rules", label: "Rules" },
  { href: "/members", label: "Members" },
  { href: "/payouts", label: "Payouts" },
  { href: "/articles", label: "Articles" },
];

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1f3a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f1f3a]/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#f0c75e] hover:text-yellow-300 transition-colors"
        >
          <span aria-hidden className="text-xl">🌭</span>
          <span className="font-bold tracking-tight text-base sm:text-lg">
            Greybushes <span className="text-white/70">&amp;</span> Chili Dogs
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#f0c75e] text-[#0f1f3a]"
                    : "text-gray-200 hover:bg-white/5 hover:text-[#f0c75e]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-[#f0c75e] hover:bg-white/5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="lg:hidden border-t border-white/10 bg-[#0f1f3a]"
        >
          <ul className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#f0c75e] text-[#0f1f3a]"
                        : "text-gray-200 hover:bg-white/5 hover:text-[#f0c75e]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
