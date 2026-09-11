/**
 * A section break inside a page: the title in the display face over a heavy
 * rule, with an optional line of mono underneath saying what the section is
 * counting. The rule is what separates sections, so no section needs its own
 * box or its own colour.
 */
export default function SectionHeading({
  id,
  title,
  note,
}: {
  id?: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-5 border-b-2 border-ink pb-2">
      <h2
        id={id}
        className="font-[family-name:var(--wire-display)] text-[22px] font-extrabold uppercase tracking-[0.02em] text-ink"
      >
        {title}
      </h2>
      {note && (
        <p className="mt-1 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {note}
        </p>
      )}
    </div>
  );
}
