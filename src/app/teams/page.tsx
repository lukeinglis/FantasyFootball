import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/fetcher";
import type { Team } from "@/lib/yahoo/types";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import NotConnected, { ApiError } from "@/components/NotConnected";
import OffseasonState from "@/components/OffseasonState";
import { Card } from "@/components/Card";
import { formatPoints, formatRecord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Teams",
  description: "All Greybushes & Chili Dogs teams, managers, and records.",
};

export const dynamic = "force-dynamic";

function teamSlug(teamKey: string): string {
  // Yahoo team keys are like "nfl.l.123.t.4" — use the entire key URL-encoded.
  return encodeURIComponent(teamKey);
}

export default async function TeamsPage() {
  const result = await apiFetch<Team[]>("/api/yahoo/teams");

  return (
    <>
      <PageHeader
        eyebrow="The League"
        title="Teams"
        subtitle="Every franchise, every record, every manager who refuses to set their lineup."
      />
      <Container>
        {!result.ok ? (
          result.notConfigured ? (
            <NotConnected resource="teams" />
          ) : result.offseason ? (
            <OffseasonState resource="teams" />
          ) : (
            <ApiError resource="teams" detail={result.message} />
          )
        ) : result.data.length === 0 ? (
          <Card>
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No teams found.
            </div>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((t) => (
              <li key={t.teamKey}>
                <Link
                  href={`/teams/${teamSlug(t.teamKey)}`}
                  className="block h-full rounded-xl border border-white/10 bg-[#112d4e] p-5 transition-colors hover:border-[#DD550C]/40 hover:bg-[#183558]"
                >
                  <div className="flex items-start gap-3">
                    {t.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.logoUrl}
                        alt=""
                        className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#DD550C]/20 text-lg font-bold text-[#DD550C]">
                        {t.teamName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {t.teamName}
                      </h3>
                      <p className="truncate text-xs text-gray-400">
                        {t.managerName}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <dt className="text-gray-500">Record</dt>
                      <dd className="mt-0.5 font-mono text-white">
                        {formatRecord(t.wins, t.losses, t.ties)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">PF</dt>
                      <dd className="mt-0.5 font-mono text-[#DD550C]">
                        {formatPoints(t.pointsFor, 1)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">PA</dt>
                      <dd className="mt-0.5 font-mono text-gray-300">
                        {formatPoints(t.pointsAgainst, 1)}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
