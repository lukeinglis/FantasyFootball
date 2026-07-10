import type { Metadata } from "next";
import punishmentsData from "@/data/punishments.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Wall of Shame",
  description:
    "Last place punishments, immortalized so they can never be forgotten.",
};

interface Punishment {
  season: number | string;
  loser?: string;
  team?: string;
  punishment?: string;
  description?: string;
  evidenceUrl?: string;
  evidenceLabel?: string;
}

interface PunishmentsFile {
  punishments: Punishment[];
}

const data = punishmentsData as PunishmentsFile;

export default function WallOfShamePage() {
  const items = [...data.punishments].sort((a, b) => {
    const ay = Number(a.season) || 0;
    const by = Number(b.season) || 0;
    return by - ay;
  });

  return (
    <>
      <PageHeader
        eyebrow="Held to Account"
        title="Wall of Shame"
        subtitle="Finishing last in this league has consequences. These are them."
      />
      <Container>
        {items.length === 0 ? (
          <EmptyState
            icon={<span>💀</span>}
            title="The wall is empty (for now)"
            description="No punishments have been recorded yet. The first last-place finisher to accept their fate will be eternally enshrined here."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((p, i) => (
              <li key={`${p.season}-${i}`}>
                <Card variant="chalkboard">
                  <CardBody variant="chalkboard">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-widest text-[#D4A847]">
                          Season {p.season}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-[#F5F0E8]" style={{ fontFamily: "var(--font-display)", textShadow: "0 0 4px rgba(245,240,232,0.2)" }}>
                          {p.loser || "Unknown loser"}
                          {p.team && (
                            <span className="ml-2 text-sm font-normal italic text-[#F5F0E8]/50">
                              {p.team}
                            </span>
                          )}
                        </h3>
                      </div>
                      <span className="text-3xl" aria-hidden>
                        💀
                      </span>
                    </div>
                    {(p.punishment || p.description) && (
                      <p className="mt-3 text-sm text-[rgba(245,240,232,0.85)]">
                        {p.punishment || p.description}
                      </p>
                    )}
                    {p.evidenceUrl && (
                      <a
                        href={p.evidenceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#DD550C] hover:underline"
                      >
                        {p.evidenceLabel || "View the evidence"} →
                      </a>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
