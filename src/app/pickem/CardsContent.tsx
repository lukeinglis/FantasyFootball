import Container from "@/components/Container";
import { Card } from "@/components/Card";
import pickemData from "@/data/pickem.json";
import { buildBoard, buildContrarians, type PickemData } from "@/lib/pickem";

const data = pickemData as PickemData;
const board = buildBoard(data);
const contrarians = buildContrarians(data, board);
const standings = [...data.entries].sort((a, b) => b.total - a.total);

/**
 * Several managers can be equally bold, so name all of them rather than
 * crowning whoever happens to sort first.
 */
const mostAgainst = contrarians[0]?.against ?? 0;
const boldest = contrarians.filter((c) => c.against === mostAgainst);

export default function CardsContent() {

  return (
    <Container>
      <Card className="overflow-hidden" variant="scoreboard">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-surface px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Manager
                </th>
                {data.games.map((game) => (
                  <th
                    key={game.id}
                    scope="col"
                    className="px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                  >
                    Game {game.id}
                    <span className="mt-0.5 block font-[family-name:var(--wire-mono)] text-[10px] font-normal tracking-[0.08em] text-ink-faint">
                      #{game.teams[0].seed} v #{game.teams[1].seed}
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-3 py-3 text-right font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Tiebreaker
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => (
                <tr key={entry.name} className="border-b border-rule">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.02em] text-ink"
                  >
                    {entry.name}
                  </th>
                  {entry.picks.map((pick, index) => {
                    const againstTheGrain =
                      board[index].consensus !== null &&
                      board[index].consensus !== pick.team;
                    return (
                      <td
                        key={data.games[index].id}
                        className="px-3 py-2.5 align-top"
                      >
                        <span
                          className={`font-[family-name:var(--wire-body)] text-[13px] leading-tight ${
                            againstTheGrain
                              ? "font-semibold text-result"
                              : "text-ink"
                          }`}
                        >
                          {pick.team}
                        </span>
                        <span className="mt-0.5 block font-[family-name:var(--wire-mono)] text-[11px] text-ink-muted">
                          {pick.total}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right align-top font-[family-name:var(--wire-mono)] text-[14px] font-semibold text-ink">
                    {entry.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-rule px-3 py-2">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            <span className="text-result">Red</span> marks a pick against the
            consensus
            {mostAgainst > 0 && (
              <>
                {" \u00B7 "}
                {boldest.length > 1 ? "Boldest cards: " : "Boldest card: "}
                {boldest.map((c) => c.name).join(", ")} ({mostAgainst} against)
              </>
            )}
          </p>
        </div>
      </Card>
    </Container>
  );
}
