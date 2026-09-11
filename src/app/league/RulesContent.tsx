import rulesData from "@/data/rules.json";
import Container from "@/components/Container";

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

/**
 * A rulebook is a citable document, so the numbering is real: section 4, rule
 * 4.02. That gives anyone arguing in the group chat something to point at,
 * which a row of bullet dots does not. The old version stacked every section in
 * an identical card, which buried the one thing the page is for.
 */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default function RulesContent() {
  return (
    <Container>
      <div className="border-t border-ink">
        {data.sections.map((section, s) => (
          <section
            key={section.title}
            data-testid="rules-section"
            className="grid gap-x-8 gap-y-3 border-b border-rule py-6 md:grid-cols-[10rem_1fr]"
          >
            <h2 className="md:sticky md:top-24 md:self-start">
              <span className="block font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.16em] text-result">
                Section {s + 1}
              </span>
              <span className="mt-1 block font-[family-name:var(--wire-display)] text-[19px] font-extrabold uppercase leading-[1.1] tracking-[0.01em] text-ink">
                {section.title}
              </span>
            </h2>

            <ol className="space-y-0">
              {section.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex gap-4 border-b border-rule/60 py-2.5 last:border-0 last:pb-0"
                >
                  <span className="w-10 flex-shrink-0 font-[family-name:var(--wire-mono)] text-[11px] leading-[1.6] tabular-nums text-ink-faint">
                    {s + 1}.{pad(i + 1)}
                  </span>
                  <span className="text-[14px] leading-[1.6] text-ink-soft">
                    {rule}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {data.notes && (
        <p className="mt-5 max-w-[62ch] font-[family-name:var(--wire-mono)] text-[11px] leading-[1.7] text-ink-muted">
          {data.notes}
        </p>
      )}
    </Container>
  );
}
