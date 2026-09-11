import payoutsData from "@/data/payouts.json";
import membersData from "@/data/members.json";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { PAYOUTS } from "@/lib/constants";
import { formatUsd, toFiniteNumber } from "@/lib/format";

interface WeeklyPayout {
  week: number | string;
  description?: string;
  amount: number;
  winner?: string;
  team?: string;
}

interface PayoutsFile {
  buyIn?: number;
  totalPot?: number;
  yearly?: { first?: number; second?: number; third?: number };
  weeklyPayouts?: WeeklyPayout[];
}

const data = payoutsData as PayoutsFile;
const members = membersData as { active: unknown[]; emeritus: unknown[] };
const activeCount = Array.isArray(members.active) ? members.active.length : 0;

/**
 * `src/lib/constants.ts` is the single source of truth for money. The JSON file
 * is not allowed to override it; only the weekly ledger is read from the file.
 */
const buyIn = PAYOUTS.buyIn;
const totalPot = PAYOUTS.totalPot;
const weeklyPool = PAYOUTS.weeklyPool;
const yearEndPool = PAYOUTS.yearEndPool;

const weekly = (data.weeklyPayouts ?? []).slice().sort((a, b) => {
  const aw = Number(a.week) || 0;
  const bw = Number(b.week) || 0;
  return aw - bw;
});
const weeklyTotal = weekly.reduce(
  (sum, w) => sum + toFiniteNumber(w.amount, 0),
  0,
);

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-record/10 pb-2 last:border-0 last:pb-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`font-mono ${
 emphasis ? "text-result font-semibold" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function PayoutsContent() {
  return (
    <Container>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="scoreboard">
          <CardHeader
            title="Season-End Prizes"
            description="Standard structure, paid out after the championship."
          />
          <CardBody>
            <div className="border border-rule bg-paper px-4 py-4">
              <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                Year-end pool
              </p>
              <p className="mt-1 font-[family-name:var(--wire-display)] text-[38px] font-extrabold leading-none text-ink">
                {formatUsd(yearEndPool)}
              </p>
              <p className="mt-2 max-w-[46ch] text-[13px] leading-[1.5] text-ink-soft">
                Paid out after the championship. How it splits across first,
                second and third is not written down anywhere, so it is not
                listed here.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-rule pt-4 text-sm">
              <span className="text-ink-muted">Weekly pool</span>
              <span className="font-mono text-ink">
                {formatUsd(weeklyPool)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-ink-muted">Total pot</span>
              <span className="font-mono text-ink">{formatUsd(totalPot)}</span>
            </div>
          </CardBody>
        </Card>

        <Card variant="scoreboard">
          <CardHeader
            title="The Math"
            description="Where every dollar of the pot is going."
          />
          <CardBody>
            <dl className="space-y-3 text-sm">
              <Row label="Buy-in" value={formatUsd(buyIn)} />
              <Row label="Active members" value={String(activeCount)} />
              <Row label="Total pot" value={formatUsd(totalPot)} />
              <Row
                label={`Weekly pool (${PAYOUTS.weeklyWeeks} × ${formatUsd(PAYOUTS.weeklyPerWeek)})`}
                value={formatUsd(weeklyPool)}
              />
              <Row label="Year-end pool" value={formatUsd(yearEndPool)} />
              <Row
                label="Weekly payouts recorded"
                value={formatUsd(weeklyTotal)}
                emphasis
              />
            </dl>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card variant="scoreboard">
          <CardHeader
            title="Weekly Payouts"
            description="High score, lowest score, or whatever side bet stuck this year."
          />
          <CardBody className="!p-0">
            {weekly.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState
                  title="No weekly payouts configured"
                  description="If the league sets up high-score bonuses or other side bets, they'll show up here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-record/30">
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Week</th>
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Description</th>
                      <th className="px-3 py-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Winner</th>
                      <th className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-record">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {weekly.map((w, i) => (
                      <tr
                        key={`${w.week}-${i}`}
                        className="hover:bg-paper transition-colors"
                      >
                        <td className="px-3 py-3 font-[family-name:var(--font-heading)] text-result">
                          {w.week}
                        </td>
                        <td className="px-3 py-3 text-ink-soft">
                          {w.description || "—"}
                        </td>
                        <td className="px-3 py-3 text-ink">
                          {w.winner ? (
                            <>
                              <span className="font-medium">{w.winner}</span>
                              {w.team && (
                                <span className="ml-1 text-xs text-ink-muted">
                                  ({w.team})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-ink-faint">TBD</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-[family-name:var(--font-heading)] text-result">
                          {formatUsd(toFiniteNumber(w.amount, 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
