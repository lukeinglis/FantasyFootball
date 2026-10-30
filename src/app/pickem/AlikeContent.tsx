import Container from "@/components/Container";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import pickemData from "@/data/pickem.json";
import {
  buildAgreement,
  buildIdenticalGroups,
  type PickemData,
} from "@/lib/pickem";

const data = pickemData as PickemData;
const { names, rows, gameCount, pairs } = buildAgreement(data);

const identical = buildIdenticalGroups(data);
const furthest =
  pairs.length > 0
    ? pairs.filter((p) => p.agreed === pairs[pairs.length - 1].agreed)
    : [];

/**
 * Heat is keyed off the share of games two cards share rather than a raw
 * count, so the scale still reads correctly if a week ever has more or fewer
 * than six matchups.
 */
function cellTone(agreed: number): string {
  const ratio = gameCount > 0 ? agreed / gameCount : 0;
  if (ratio === 1) return "bg-result text-white";
  if (ratio >= 0.8) return "bg-result/30 text-ink";
  if (ratio >= 0.6) return "bg-result/15 text-ink";
  if (ratio >= 0.4) return "bg-paper text-ink-soft";
  return "bg-surface text-ink-faint";
}

/**
 * Identical cards are listed as whole blocs, so three managers who picked
 * the same way read as one group of three rather than three separate pairs.
 */
function GroupList({ label, groups }: { label: string; groups: string[][] }) {
  if (groups.length === 0) return null;
  return (
    <div className="border border-rule bg-surface px-4 py-3">
      <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {groups.map((group) => (
          <li
            key={group.join("-")}
            className="font-[family-name:var(--wire-body)] text-[15px] text-ink"
          >
            {group.join(", ")}
            <span className="ml-2 font-[family-name:var(--wire-mono)] text-[12px] text-ink-muted">
              {group.length === 2
                ? "both the same"
                : `all ${group.length} the same`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PairList({ label, list }: { label: string; list: typeof pairs }) {
  if (list.length === 0) return null;
  return (
    <div className="border border-rule bg-surface px-4 py-3">
      <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {list.map((p) => (
          <li
            key={`${p.a}-${p.b}`}
            className="font-[family-name:var(--wire-body)] text-[15px] text-ink"
          >
            {p.a} &amp; {p.b}
            <span className="ml-2 font-[family-name:var(--wire-mono)] text-[12px] text-ink-muted">
              {p.agreed}/{gameCount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AlikeContent() {
  if (names.length < 2) {
    return (
      <Container>
        <EmptyState
          title="Not enough cards yet"
          description="Two managers have to submit before anyone can agree on anything."
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <GroupList label="Identical cards" groups={identical} />
        <PairList label="Furthest apart" list={furthest} />
      </div>

      <Card className="overflow-hidden" variant="scoreboard">
        <div className="overflow-x-auto">
          <table className="text-left text-sm">
            <caption className="sr-only">
              How many of the {gameCount} games each pair of managers picked the
              same way
            </caption>
            <thead>
              <tr className="border-b-2 border-ink">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-surface px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Agrees with
                </th>
                {names.map((name) => (
                  <th
                    key={name}
                    scope="col"
                    title={name}
                    className="w-12 px-1 py-3 text-center font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.08em] text-ink-muted"
                  >
                    {name.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((rowName, i) => (
                <tr key={rowName} className="border-b border-rule">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-[family-name:var(--wire-display)] text-[13px] font-bold uppercase tracking-[0.02em] text-ink"
                  >
                    {rowName}
                  </th>
                  {names.map((colName, j) => {
                    if (i === j) {
                      return (
                        <td
                          key={colName}
                          className="bg-night/5 px-1 py-2 text-center font-[family-name:var(--wire-mono)] text-[12px] text-ink-faint"
                        >
                          &ndash;
                        </td>
                      );
                    }
                    const agreed = rows[i][j];
                    return (
                      <td
                        key={colName}
                        title={`${rowName} and ${colName} agree on ${agreed} of ${gameCount}`}
                        className={`px-1 py-2 text-center font-[family-name:var(--wire-mono)] text-[12px] font-semibold ${cellTone(agreed)}`}
                      >
                        {agreed}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-rule px-3 py-2">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {`Games picked the same way out of ${gameCount} \u00B7 darker means more alike`}
          </p>
        </div>
      </Card>
    </Container>
  );
}
