import Container from "@/components/Container";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import pickemData from "@/data/pickem.json";
import { buildScoreboard, type PickemData } from "@/lib/pickem";

const data = pickemData as PickemData;
const { rows, decided, gameCount, actualTotal, complete, problems } =
  buildScoreboard(data);

const leaders = rows.filter((r) => r.rank === 1);

/** A tick, a cross, or an en-dash for a game that has not finished. */
function Mark({ value }: { value: boolean | null }) {
  if (value === null) {
    return (
      <span className="text-ink-faint" title="Not final yet">
        &ndash;
      </span>
    );
  }
  return value ? (
    <span className="text-result" title="Right">
      &#10003;
    </span>
  ) : (
    <span className="text-ink-faint" title="Wrong">
      &#10007;
    </span>
  );
}

export default function ScoreboardContent() {
  if (decided === 0 && problems.length === 0) {
    return (
      <Container>
        <EmptyState
          title="No results yet"
          description="Scores show up here as each game goes final."
        />
      </Container>
    );
  }

  return (
    <Container>
      {problems.length > 0 && (
        <div className="mb-6 border-l-2 border-result bg-surface px-4 py-3">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
            Check the results in pickem.json
          </p>
          <ul className="mt-1 space-y-1">
            {problems.map((p) => (
              <li
                key={p}
                className="font-[family-name:var(--wire-body)] text-[15px] text-ink"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {leaders.length > 0 && decided > 0 && (
        <div className="mb-6 border-l-2 border-result bg-surface px-4 py-3">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
            {complete ? "Winner" : "Leading"}
          </p>
          <p className="mt-1 font-[family-name:var(--wire-body)] text-[15px] text-ink">
            {leaders.map((l) => l.name).join(", ")} at {leaders[0].correct} of{" "}
            {decided}
            {complete
              ? `, with the real total at ${actualTotal}.`
              : `, with ${gameCount - decided} still to play.`}
          </p>
        </div>
      )}

      <Card className="overflow-hidden" variant="scoreboard">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                <th
                  scope="col"
                  className="px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Manager
                </th>
                {data.games.map((game) => (
                  <th
                    key={game.id}
                    scope="col"
                    className="w-10 px-1 py-3 text-center font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.08em] text-ink-muted"
                  >
                    G{game.id}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-3 py-3 text-right font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Right
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Tiebreaker
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-rule">
                  <td className="px-3 py-2.5 font-[family-name:var(--wire-mono)] text-[12px] text-ink-muted">
                    {row.rank}
                  </td>
                  <th
                    scope="row"
                    className="px-3 py-2.5 text-left font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.02em] text-ink"
                  >
                    {row.name}
                  </th>
                  {row.marks.map((mark, i) => (
                    <td
                      key={data.games[i].id}
                      className="px-1 py-2.5 text-center font-[family-name:var(--wire-mono)] text-[13px]"
                    >
                      <Mark value={mark} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-[family-name:var(--wire-mono)] text-[14px] font-semibold text-ink">
                    {row.correct}
                    <span className="text-ink-faint">/{decided}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-[family-name:var(--wire-mono)] text-[13px] text-ink-muted">
                    {row.predicted}
                    {row.tiebreakerDiff !== null && (
                      <span className="ml-2 text-ink-faint">
                        off by {row.tiebreakerDiff}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-rule px-3 py-2">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {complete
              ? `Final \u00B7 ties broken by whoever came closest to ${actualTotal}`
              : `${decided} of ${gameCount} games final \u00B7 the tiebreaker only counts once every game is in`}
          </p>
        </div>
      </Card>
    </Container>
  );
}
