import type { Metadata } from "next";
import rulesData from "@/data/rules.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export const metadata: Metadata = {
  title: "League Rules",
  description: "Official rules and bylaws of Greybushes & Chili Dogs.",
};

interface RulesSection {
  title: string;
  rules: string[];
}

interface RulesFile {
  leagueName: string;
  platform: string;
  scoring: string;
  sections: RulesSection[];
  notes?: string;
}

const data = rulesData as RulesFile;

export default function RulesPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Law"
        title="League Rules"
        subtitle={`${data.platform} · ${data.scoring} · The bylaws every manager agreed to (and promptly forgot).`}
      />
      <Container>
        <div className="space-y-6">
          {data.sections.map((section) => (
            <div key={section.title} data-testid="rules-section">
              <Card variant="chalkboard">
                <div className="border-b border-[#8B5E3C]/30 px-5 py-4">
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#F5F0E8] text-shadow-glow-chalk">
                    {section.title}
                  </h2>
                </div>
                <CardBody variant="chalkboard">
                  <ul className="space-y-2">
                    {section.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A847]/60" />
                        <span className="text-[rgba(245,240,232,0.85)]">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {data.notes && (
          <p className="mt-6 text-center text-xs text-[#F5F0E8]/40 italic">
            {data.notes}
          </p>
        )}
      </Container>
    </>
  );
}
