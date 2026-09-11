import Link from "next/link";
import type { FetchResult } from "@/lib/fetcher";
import NotConnected, { ApiError } from "./NotConnected";
import OffseasonState from "./OffseasonState";

/**
 * One place that decides what to say when a Yahoo-fed panel has no data.
 *
 * This decision used to be spelled out at each of the ten call sites as
 * `notConfigured ? ... : offseason ? ... : ...`, which meant adding a fourth
 * state meant editing ten files and getting the precedence right ten times.
 * It also meant a misclassified error was wrong everywhere at once: when Yahoo
 * revoked the league's API grant, every panel on the site announced a kickoff
 * countdown, in September, above a badge reading "Yahoo API connected".
 */
export default function DataState<T>({
  result,
  resource,
}: {
  result: Extract<FetchResult<T>, { ok: false }>;
  resource: string;
}) {
  // Order matters. A refusal from Yahoo also trips the older, looser config and
  // offseason heuristics, and it is the most specific thing we know, so it wins.
  if (result.accessDenied) return <FeedPaused resource={resource} />;
  if (result.notConfigured) return <NotConnected resource={resource} />;
  if (result.offseason) return <OffseasonState resource={resource} />;
  return <ApiError resource={resource} detail={result.message} />;
}

/**
 * Yahoo has the data and will not give it to us.
 *
 * Says so, rather than implying the reader should wait for kickoff or that the
 * commissioner forgot to click something. Points at the archive, which is the
 * part of the site that still works and is most of why anyone visits.
 */
export function FeedPaused({ resource }: { resource: string }) {
  return (
    <div className="border border-rule bg-surface px-6 py-10 text-center">
      <h3 className="font-[family-name:var(--wire-display)] text-[17px] font-extrabold uppercase tracking-[0.06em] text-ink">
        Live {resource} paused
      </h3>
      <p className="mx-auto mt-2 max-w-[52ch] font-[family-name:var(--wire-body)] text-[14px] leading-[1.5] text-ink-muted">
        Yahoo moved Fantasy Sports API access behind an approval process in 2026
        and our league&apos;s access has not been reinstated yet. Current-season{" "}
        {resource} will return when it is. Eleven seasons of league history are
        unaffected.
      </p>
      <div className="mt-4">
        <Link
          href="/history"
          className="font-[family-name:var(--wire-mono)] text-[11px] uppercase tracking-[0.14em] text-result hover:underline"
        >
          Browse the archive →
        </Link>
      </div>
    </div>
  );
}
