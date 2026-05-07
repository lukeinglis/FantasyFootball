import type { Metadata } from "next";
import membersData from "@/data/members.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";

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
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#14284a] p-4 transition-colors hover:border-[#f0c75e]/40">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f0c75e] text-base font-bold text-[#0f1f3a]">
        {initials || "?"}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{member.name}</p>
        <p className="truncate text-sm text-gray-400 italic">
          {member.teamName}
        </p>
      </div>
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
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]">
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#f0c75e]">
              Emeritus ({data.emeritus.length})
            </h2>
            <p className="mt-1 max-w-xl text-xs text-gray-500">
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
