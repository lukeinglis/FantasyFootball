import type { Metadata } from "next";
import payoutsData from "@/data/payouts.json";
import membersData from "@/data/members.json";
import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { PAYOUTS } from "@/lib/constants";
import { formatUsd, toFiniteNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Payouts",
  description: "Buy-in, prize structure, and weekly payouts.",
};

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

const buyIn = toFiniteNumber(data.buyIn ?? PAYOUTS.buyIn, PAYOUTS.buyIn);
const totalPot = toFiniteNumber(
  data.totalPot ?? PAYOUTS.totalPot,
  PAYOUTS.totalPot
);
const first = toFiniteNumber(data.yearly?.first ?? PAYOUTS.first, PAYOUTS.first);
const second = toFiniteNumber(
  data.yearly?.second ?? PAYOUTS.second,
  PAYOUTS.second
);
const third = toFiniteNumber(data.yearly?.third ?? PAYOUTS.third, PAYOUTS.third);
const weekly = (data.weeklyPayouts ?? []).slice().sort((a, b) => {
  const aw = Number(a.week) || 0;
  const bw = Number(b.week) || 0;
  return aw - bw;
});

const distributedYearly = first + second + third;
const weeklyTotal = weekly.reduce(
  (sum, w) => sum + toFiniteNumber(w.amount, 0),
  0
);

export default function PayoutsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Show Me the Money"
        title="Payouts"
        subtitle={`${formatUsd(buyIn)} to play. ${formatUsd(totalPot)} on the line.`}
      />
      <Container>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Yearly prize structure */}
          <Card>
            <CardHeader
              title="Season-End Prizes"
              description="Standard structure, paid out after the championship."
            />
            <CardBody>
              <ul className="space-y-3">
                <PrizeRow place={1} amount={first} medal="🥇" />
                <PrizeRow place={2} amount={second} medal="🥈" />
                <PrizeRow place={3} amount={third} medal="🥉" />
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-gray-400">Distributed</span>
                <span className="font-mono text-white">
                  {formatUsd(distributedYearly)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-400">Weekly pool</span>
                <span className="font-mono text-white">
                  {formatUsd(Math.max(0, totalPot - distributedYearly))}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* The math */}
          <Card>
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
                  label="Yearly prizes"
                  value={formatUsd(distributedYearly)}
                />
                <Row label="Weekly payouts assigned" value={formatUsd(weeklyTotal)} />
                <Row
                  label="Unassigned"
                  value={formatUsd(
                    Math.max(0, totalPot - distributedYearly - weeklyTotal)
                  )}
                  emphasis
                />
              </dl>
            </CardBody>
          </Card>
        </div>

        {/* Weekly payouts */}
        <div className="mt-6">
          <Card>
            <CardHeader
              title="Weekly Payouts"
              description="High score, lowest score, or whatever side bet stuck this year."
            />
            <CardBody className="!p-0">
              {weekly.length === 0 ? (
                <div className="px-5 py-6">
                  <EmptyState
                    icon={<span>💸</span>}
                    title="No weekly payouts configured"
                    description="If the league sets up high-score bonuses or other side bets, they'll show up here."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0f1f3a] text-xs uppercase tracking-wider text-gray-400">
                      <tr>
                        <th className="px-3 py-3">Week</th>
                        <th className="px-3 py-3">Description</th>
                        <th className="px-3 py-3">Winner</th>
                        <th className="px-3 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {weekly.map((w, i) => (
                        <tr
                          key={`${w.week}-${i}`}
                          className="bg-[#14284a]/40 hover:bg-[#14284a]"
                        >
                          <td className="px-3 py-3 font-mono text-[#f0c75e]">
                            {w.week}
                          </td>
                          <td className="px-3 py-3 text-gray-300">
                            {w.description || "—"}
                          </td>
                          <td className="px-3 py-3 text-white">
                            {w.winner ? (
                              <>
                                <span className="font-medium">{w.winner}</span>
                                {w.team && (
                                  <span className="ml-1 text-xs text-gray-400">
                                    ({w.team})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">TBD</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-[#f0c75e]">
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
    </>
  );
}

function PrizeRow({
  place,
  amount,
  medal,
}: {
  place: 1 | 2 | 3;
  amount: number;
  medal: string;
}) {
  const labels: Record<1 | 2 | 3, string> = {
    1: "Champion",
    2: "Runner-Up",
    3: "Third Place",
  };
  const ordinals: Record<1 | 2 | 3, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
  };
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-[#0f1f3a]/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {medal}
        </span>
        <div>
          <p className="font-semibold text-white">{labels[place]}</p>
          <p className="text-xs text-gray-400">
            {ordinals[place]} place finisher
          </p>
        </div>
      </div>
      <p className="font-mono text-xl font-bold text-[#f0c75e]">
        {formatUsd(amount)}
      </p>
    </li>
  );
}

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
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <dt className="text-gray-400">{label}</dt>
      <dd
        className={`font-mono ${
          emphasis ? "text-[#f0c75e] font-semibold" : "text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
