"use client";

import { useEffect, useState } from "react";

/**
 * NFL season typically kicks off the Thursday after Labor Day (first Monday in
 * September). This provides a reasonable target date for the countdown.
 */
function getNextSeasonKickoff(): Date {
  const now = new Date();
  let year = now.getFullYear();

  // Find the first Monday in September (Labor Day)
  function laborDay(y: number): Date {
    const sept1 = new Date(y, 8, 1); // September 1
    const dayOfWeek = sept1.getDay();
    // Days until Monday: 0=Sun->1, 1=Mon->0, 2=Tue->6, 3=Wed->5...
    const daysUntilMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    return new Date(y, 8, 1 + daysUntilMon);
  }

  // Kickoff Thursday = Labor Day + 4 days, typically 8:20 PM ET
  function kickoffDate(y: number): Date {
    const ld = laborDay(y);
    return new Date(y, 8, ld.getDate() + 4, 20, 20, 0);
  }

  let target = kickoffDate(year);
  // If we're past this year's kickoff, target next year
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

  return (
    <div className="rounded-xl border border-[#f0c75e]/20 bg-[#0f1f3a]/80 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]/80">
        Countdown to Kickoff
      </p>
      <p className="mt-1 text-sm text-gray-400">
        NFL Season Opener: {targetStr}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-3 text-center">
        <CountdownUnit value={timeLeft.days} label="Days" />
        <CountdownUnit value={timeLeft.hours} label="Hours" />
        <CountdownUnit value={timeLeft.minutes} label="Min" />
        <CountdownUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-bold text-white sm:text-3xl">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
    </div>
  );
}
