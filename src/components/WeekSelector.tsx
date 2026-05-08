"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface WeekSelectorProps {
  current: number;
  startWeek: number;
  endWeek: number;
}

export default function WeekSelector({
  current,
  startWeek,
  endWeek,
}: WeekSelectorProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const start = Math.max(1, Math.min(startWeek, endWeek));
  const end = Math.max(start, endWeek);
  const weeks: number[] = [];
  for (let i = start; i <= end; i++) weeks.push(i);

  function navigateTo(week: number) {
    const sp = new URLSearchParams(params?.toString() ?? "");
    sp.set("week", String(week));
    startTransition(() => {
      router.push(`?${sp.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="week-select">
        Select week
      </label>
      <select
        id="week-select"
        value={current}
        onChange={(e) => navigateTo(Number(e.target.value))}
        className="rounded-md border border-white/10 bg-[#112d4e] px-3 py-1.5 text-sm font-medium text-white focus:border-[#DD550C]"
      >
        {weeks.map((w) => (
          <option key={w} value={w}>
            Week {w}
          </option>
        ))}
      </select>
      <div className="hidden sm:flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigateTo(Math.max(start, current - 1))}
          disabled={current <= start}
          className="rounded-md border border-white/10 bg-[#112d4e] px-2 py-1.5 text-xs text-gray-200 hover:bg-[#183558] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous week"
        >
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={() => navigateTo(Math.min(end, current + 1))}
          disabled={current >= end}
          className="rounded-md border border-white/10 bg-[#112d4e] px-2 py-1.5 text-xs text-gray-200 hover:bg-[#183558] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next week"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
