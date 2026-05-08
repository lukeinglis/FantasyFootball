"use client";

import { useEffect, useState } from "react";

function getNextSeasonKickoff(): Date {
  const now = new Date();
  let year = now.getFullYear();

  function laborDay(y: number): Date {
    const sept1 = new Date(y, 8, 1);
    const dayOfWeek = sept1.getDay();
    const daysUntilMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    return new Date(y, 8, 1 + daysUntilMon);
  }

  function kickoffDate(y: number): Date {
    const ld = laborDay(y);
    return new Date(y, 8, ld.getDate() + 4, 20, 20, 0);
  }

  let target = kickoffDate(year);
  if (now > target) {
    target = kickoffDate(year + 1);
  }

  return target;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const total = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function getOffseasonProgress(target: Date): number {
  const superBowlApprox = new Date(target.getFullYear(), 1, 10);
  const totalSpan = target.getTime() - superBowlApprox.getTime();
  const elapsed = Date.now() - superBowlApprox.getTime();
  const pct = Math.max(0, Math.min(100, (elapsed / totalSpan) * 100));
  return Math.round(pct);
}

export default function SeasonCountdown() {
  const [target] = useState(getNextSeasonKickoff);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (timeLeft.total <= 0) return null;

  const targetStr = target.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const progress = getOffseasonProgress(target);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#DD550C]/30 bg-gradient-to-br from-[#112d4e] to-[#0a1c30] p-8 shadow-xl shadow-black/30">
      <div className="stripe-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -top-8 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-[#DD550C]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.3em] text-[#DD550C]">
          Countdown to Kickoff
        </p>
        <p className="mt-1 text-sm text-gray-400">
          NFL Season Opener: {targetStr}
        </p>

        <div className="mt-6 flex items-baseline justify-center gap-2 text-center">
          <CountdownUnit value={timeLeft.days} label="Days" />
          <span className="text-2xl font-bold text-[#DD550C]/40 pb-5">:</span>
          <CountdownUnit value={timeLeft.hours} label="Hours" />
          <span className="text-2xl font-bold text-[#DD550C]/40 pb-5">:</span>
          <CountdownUnit value={timeLeft.minutes} label="Min" />
          <span className="text-2xl font-bold text-[#DD550C]/40 pb-5">:</span>
          <CountdownUnit value={timeLeft.seconds} label="Sec" />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
            <span>Super Bowl</span>
            <span>Kickoff</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#DD550C] to-[#ff8a3d] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p
        className="font-[family-name:var(--font-heading)] font-bold text-4xl text-white sm:text-5xl"
        style={{ textShadow: "0 0 20px rgba(221, 85, 12, 0.4)" }}
      >
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#DD550C]/70">
        {label}
      </p>
    </div>
  );
}
