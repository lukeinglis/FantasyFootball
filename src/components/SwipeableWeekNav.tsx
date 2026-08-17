"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useSwipeable } from "@/lib/use-swipeable";

interface SwipeableWeekNavProps {
  children: ReactNode;
  currentWeek: number;
  startWeek: number;
  endWeek: number;
}

export default function SwipeableWeekNav({
  children,
  currentWeek,
  startWeek,
  endWeek,
}: SwipeableWeekNavProps) {
  const router = useRouter();
  const params = useSearchParams();

  const navigateTo = useCallback(
    (week: number) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      sp.set("week", String(week));
      router.push(`?${sp.toString()}`, { scroll: false });
    },
    [router, params],
  );

  const ref = useSwipeable({
    onSwipeLeft: () => {
      if (currentWeek < endWeek) navigateTo(currentWeek + 1);
    },
    onSwipeRight: () => {
      if (currentWeek > startWeek) navigateTo(currentWeek - 1);
    },
    threshold: 50,
  });

  return (
    <div ref={ref} className="touch-pan-y">
      {children}
    </div>
  );
}
