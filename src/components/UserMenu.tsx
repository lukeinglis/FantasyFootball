"use client";

import { useEffect, useState } from "react";

interface UserSession {
  name: string;
  avatarUrl?: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-white/10" />
    );
  }

  if (!user) {
    return (
      <a
        href="/api/auth/yahoo"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#DD550C]/50 px-3 py-1.5 text-xs font-semibold text-[#DD550C] transition-all hover:bg-[#DD550C]/10 hover:border-[#DD550C]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Sign In
      </a>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#DD550C] to-[#a33d08] text-[10px] font-bold text-white shadow-md shadow-[#DD550C]/20">
        {initials}
      </div>
      <span className="hidden text-xs font-medium text-gray-200 sm:inline">
        {user.name}
      </span>
      <a
        href="/api/auth/signout"
        className="text-[10px] text-gray-400 hover:text-[#DD550C] transition-colors"
        title="Sign out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </a>
    </div>
  );
}
