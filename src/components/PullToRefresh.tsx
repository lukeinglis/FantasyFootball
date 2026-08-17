"use client";

import type { ReactNode } from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      const clamped = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(clamped);
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, router]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="overscroll-y-contain"
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 10 ? pullDistance : 0 }}
      >
        <div className="flex items-center gap-2 text-xs text-[#D4A847]/70">
          {refreshing ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#D4A847]/30 border-t-[#D4A847]" />
          ) : (
            <span
              className="inline-block text-sm transition-transform duration-200"
              style={{
                transform: `rotate(${pullDistance >= PULL_THRESHOLD ? 180 : 0}deg)`,
              }}
            >
              ↓
            </span>
          )}
          <span className="font-[family-name:var(--font-heading)] uppercase tracking-widest">
            {refreshing
              ? "Refreshing"
              : pullDistance >= PULL_THRESHOLD
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
