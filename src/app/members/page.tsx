import type { Metadata } from "next";
import membersData from "@/data/members.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "Members",
  description: "The 12 active managers and 2 emeritus of Greybushes & Chili Dogs.",
};

interface Member {
  name: string;
  teamName: string;
}

interface MembersFile {
  active: Member[];
  emeritus: Member[];
}

const data = membersData as MembersFile;

function MemberCard({ member }: { member: Member }) {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <div data-testid="member-card">
      <Card variant="trading-card" className="h-full">
        <div className="bg-[linear-gradient(135deg,#D32F2F,#8B1A1A)] px-4 py-3 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold text-white uppercase tracking-wide" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>
            {member.name}
          </h3>
        </div>
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4A90D9,#1565C0)] font-[family-name:var(--font-heading)] text-base font-bold text-white border-[3px] border-[#A0784C]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#2C1810]">
              {member.teamName}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MembersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Roll Call"
        title="Members"
        subtitle={`${data.active.length} active managers and ${data.emeritus.length} emeritus. The good, the bad, and the bushes.`}
      />
      <Container>
        <section data-testid="members-active">
          <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
            Active ({data.active.length})
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.active.map((m) => (
              <li key={m.name}>
                <MemberCard member={m} />
              </li>
            ))}
          </ul>
        </section>
        {data.emeritus.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
              Emeritus ({data.emeritus.length})
            </h2>
            <p className="mt-1 max-w-xl text-xs text-[#F5F0E8]/40">
              Once a degenerate, always a degenerate. These legends have
              retired their cleats but never their feuds.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.emeritus.map((m) => (
                <li key={m.name}>
                  <MemberCard member={m} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
