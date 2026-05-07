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
            <Card key={section.title}>
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-[#f0c75e]">
                  {section.title}
                </h2>
              </div>
              <CardBody>
                <ul className="space-y-2">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#f0c75e]/60" />
                      <span className="text-gray-200">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>

        {data.notes && (
          <p className="mt-6 text-center text-xs text-gray-500 italic">
            {data.notes}
          </p>
        )}
      </Container>
    </>
  );
}
