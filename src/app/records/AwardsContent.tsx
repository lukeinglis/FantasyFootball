import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import {
  getChampions,
  getCoreAwards,
  computeSuperlatives,
  type AwardTone,
} from "@/lib/awards";

/**
 * Wire uses colour, not icons, to say what kind of thing an award is. Each
 * card is topped by a 3px rule in its category colour and labelled in mono,
 * so the page can be scanned by category without a single glyph.
 */
const TONE_RULE: Record<AwardTone, string> = {
  record: "bg-record",
  result: "bg-result",
  punishment: "bg-punishment",
};

const TONE_TEXT: Record<AwardTone, string> = {
  record: "text-record",
  result: "text-result",
  punishment: "text-punishment",
};

const TONE_LABEL: Record<AwardTone, string> = {
  record: "Record",
  result: "Result",
  punishment: "Punishment",
};

function AwardCard({
  tone,
  name,
  winner,
  team,
  stat,
  footnote,
  description,
}: {
  tone: AwardTone;
  name: string;
  winner: string;
  team?: string;
  stat: string;
  footnote?: string;
  description?: string;
}) {
  return (
    <article className="border border-rule bg-surface">
      <div className={`h-[3px] ${TONE_RULE[tone]}`} />
      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-[family-name:var(--wire-display)] text-[15px] font-extrabold uppercase tracking-[0.03em] text-ink">
            {name}
          </h3>
          <span
            className={`flex-shrink-0 font-[family-name:var(--wire-mono)] text-[9px] uppercase tracking-[0.14em] ${TONE_TEXT[tone]}`}
          >
            {TONE_LABEL[tone]}
          </span>
        </div>
        <p className="mt-3 text-[19px] font-semibold leading-tight text-ink">
          {winner}
        </p>
        {team && <p className="text-[12px] text-ink-muted">{team}</p>}
        <p className="mt-2 font-[family-name:var(--wire-mono)] text-[13px] tabular-nums text-ink">
          {stat}
        </p>
        {footnote && (
          <p className="mt-0.5 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            {footnote}
          </p>
        )}
        {description && (
          <p className="mt-2 border-t border-rule pt-2 text-[12px] leading-[1.45] text-ink-soft">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}

export default function AwardsContent() {
  const champions = getChampions();
  const coreAwards = getCoreAwards();
  const superlatives = computeSuperlatives();

  return (
    <Container>
      <section aria-labelledby="champions-heading" className="mb-12">
        <SectionHeading
          id="champions-heading"
          title="Championship Shelf"
          note={`${champions.length} seasons · every title so far`}
        />
        {/* A shelf is a run of years, so it is set as a run of narrow columns
            rather than a card grid: the eye reads left to right by date. */}
        <ol className="grid grid-cols-2 border-s border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
          {champions
            .slice()
            .sort((a, b) => b.year - a.year)
            .map((c) => (
              <li
                key={c.year}
                className="border-b border-e border-rule bg-surface px-3 py-4"
              >
                <p className="font-[family-name:var(--wire-mono)] text-[11px] tabular-nums tracking-[0.1em] text-record">
                  {c.year}
                </p>
                <p className="mt-1.5 font-[family-name:var(--wire-display)] text-[16px] font-extrabold uppercase leading-tight text-ink">
                  {c.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">
                  {c.team}
                </p>
              </li>
            ))}
        </ol>
      </section>

      <section aria-labelledby="core-awards-heading" className="mb-12">
        <SectionHeading
          id="core-awards-heading"
          title="Core Awards"
          note="The single best and worst performances on record"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreAwards.map((award) => (
            <AwardCard
              key={award.name}
              tone={award.tone}
              name={award.name}
              winner={award.winner}
              team={award.team}
              stat={award.stat}
              footnote={`${award.season} season`}
              description={award.description}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="superlatives-heading">
        <SectionHeading
          id="superlatives-heading"
          title="Superlatives"
          note="Computed across every box score since 2015"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {superlatives.map((s) => (
            <AwardCard
              key={s.name}
              tone={s.tone}
              name={s.name}
              winner={s.winner}
              stat={s.stat}
              description={s.description}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
