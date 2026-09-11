import type { Metadata } from "next";
import Link from "next/link";
import { fetchTeams } from "@/lib/server-data";

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
  return encodeURIComponent(teamKey);
}

export default async function TeamsPage() {
  const result = await fetchTeams();

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
          <Card variant="scoreboard">
            <div className="px-5 py-8 text-center text-sm text-ink-muted">
              No teams found.
            </div>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((t) => (
              <li key={t.teamKey}>
                <Link
                  href={`/teams/${teamSlug(t.teamKey)}`}
                  className="group block h-full"
                >
                  <Card variant="trading-card" className="h-full">
                    <div className="bg-[linear-gradient(135deg,#D7263D,#D7263D)] px-4 py-3 flex items-center gap-3">
                      {t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.logoUrl}
                          alt=""
                          className="h-10 w-10 flex-shrink-0 object-cover border-2 border-rule"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-record font-[family-name:var(--font-heading)] text-lg font-bold text-surface">
                          {t.teamName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-[family-name:var(--font-heading)] text-sm font-bold text-ink uppercase tracking-wide">
                          {t.teamName}
                        </h3>
                        <p className="truncate text-xs text-ink-muted">
                          {t.managerName}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <dt className="text-[#6B7789] font-semibold uppercase tracking-wider text-[10px]">Record</dt>
                          <dd className="mt-0.5 font-[family-name:var(--font-heading)] text-sm text-ink">
                            {formatRecord(t.wins, t.losses, t.ties)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#6B7789] font-semibold uppercase tracking-wider text-[10px]">PF</dt>
                          <dd className="mt-0.5 font-[family-name:var(--font-heading)] text-sm text-result">
                            {formatPoints(t.pointsFor, 1)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#6B7789] font-semibold uppercase tracking-wider text-[10px]">PA</dt>
                          <dd className="mt-0.5 font-[family-name:var(--font-heading)] text-sm text-ink">
                            {formatPoints(t.pointsAgainst, 1)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
