import Container from "@/components/Container";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import pickemData from "@/data/pickem.json";
import {
  buildOutlook,
  buildScoreboard,
  type PickemData,
  type Scenario,
} from "@/lib/pickem";

const data = pickemData as PickemData;
const { rows, decided, gameCount, actualTotal, complete, problems } =
  buildScoreboard(data);

const outlook = buildOutlook(data);
const out = new Set(outlook.eliminated);

/**
 * Every branch is worth showing while there are a handful of games left, but
 * the count doubles per game, so a full week would be sixty-four rows of
 * noise. Past a point the table stops being a table.
 */
const SHOW_MATRIX_UP_TO = 4;

const leaders = rows.filter((r) => r.rank === 1);

/**
 * When a game goes against the whole room, every card is level and naming all
 * twelve "leaders" says nothing. Call that out as level instead.
 */
const allLevel = rows.length > 1 && leaders.length === rows.length;

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

/**
 * What the result would actually be. The tiebreaker settles most ties, but
 * not one between cards that predicted the same total, so the grid must not
 * promise a winner it cannot produce.
 */
function outcomeNote(scenario: Scenario): string {
  if (scenario.winners.length === 1) return `${scenario.topCorrect} right`;

  const stuck = scenario.deadHeat.map((g) => g.join(" & "));
  if (stuck.length === 0) {
    return `level on ${scenario.topCorrect}, tiebreaker decides`;
  }
  if (scenario.deadHeat.flat().length === scenario.winners.length) {
    return `dead heat on ${scenario.topCorrect}, same tiebreaker \u2014 they share it`;
  }
  return `level on ${scenario.topCorrect}, and ${stuck.join(", ")} cannot be split`;
}

/**
 * Every way the open games can fall, and who finishes on top in each. Games
 * the whole room picked the same way are left out of the grid and named
 * underneath instead: they move every card together, so they can change the
 * scores without changing the order.
 */
function Outlook() {
  if (outlook.pivotal.length === 0) return null;

  const tooMany = outlook.pivotal.length > SHOW_MATRIX_UP_TO;

  return (
    <Card className="mt-6 overflow-hidden" variant="scoreboard">
      <div className="border-b border-ink px-4 py-3">
        <h2 className="font-[family-name:var(--wire-display)] text-[15px] font-extrabold uppercase tracking-[0.08em] text-ink">
          What is still open
        </h2>
        <p className="mt-0.5 font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.1em] text-ink-muted">
          {outlook.pivotal.length === 1
            ? "The one game that can still change the order"
            : `The ${outlook.pivotal.length} games that can still change the order`}
        </p>
      </div>

      {tooMany ? (
        <div className="px-4 py-3">
          <p className="font-[family-name:var(--wire-body)] text-[15px] text-ink-soft">
            Too many games left to lay out every combination. Check back once a
            few have gone.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">
              Who would finish on top for each combination of the remaining
              results
            </caption>
            <thead>
              <tr className="border-b-2 border-ink">
                {outlook.pivotal.map((game) => (
                  <th
                    key={game.id}
                    scope="col"
                    className="px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                  >
                    Game {game.id} goes
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-3 py-3 font-[family-name:var(--wire-display)] text-[11px] uppercase tracking-[0.1em] text-ink"
                >
                  Then on top
                </th>
              </tr>
            </thead>
            <tbody>
              {outlook.scenarios.map((scenario) => (
                <tr
                  key={scenario.outcome.join("|")}
                  className="border-b border-rule"
                >
                  {scenario.outcome.map((team, i) => (
                    <td
                      key={outlook.pivotal[i].id}
                      className="px-3 py-2.5 font-[family-name:var(--wire-display)] text-[13px] font-bold uppercase tracking-[0.02em] text-ink-muted"
                    >
                      {team}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 font-[family-name:var(--wire-body)] text-[15px] text-ink">
                    {scenario.winners.join(", ")}
                    <span className="ml-2 font-[family-name:var(--wire-mono)] text-[12px] text-ink-faint">
                      {outcomeNote(scenario)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-1.5 border-t border-rule px-4 py-3">
        <p className="font-[family-name:var(--wire-body)] text-[13px] leading-[1.5] text-ink-soft">
          <span className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-result">
            Still alive
          </span>{" "}
          {outlook.alive.join(", ")}
        </p>
        {outlook.eliminated.length > 0 && (
          <p className="font-[family-name:var(--wire-body)] text-[13px] leading-[1.5] text-ink-soft">
            <span className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              Cannot win
            </span>{" "}
            {outlook.eliminated.join(", ")}
          </p>
        )}
        {outlook.unanimous.length > 0 && (
          <p className="font-[family-name:var(--wire-body)] text-[13px] leading-[1.5] text-ink-muted">
            {outlook.unanimous
              .map((g) => `Game ${g.id}`)
              .join(" and ")}{" "}
            {outlook.unanimous.length === 1 ? "is" : "are"} not in the grid:
            every card picked the same way, so{" "}
            {outlook.unanimous.length === 1 ? "it moves" : "they move"} everyone
            together and cannot change who wins.
          </p>
        )}
      </div>
    </Card>
  );
}

export default function ScoreboardContent() {
  if (decided === 0 && problems.length === 0) {
    return (
      <Container>
        <EmptyState
          title="Nothing settled yet"
          description="Picks get marked right or wrong here as soon as a game is beyond doubt. Scores so far are on The Board."
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
            {allLevel
              ? "All level"
              : complete
                ? leaders.length > 1
                  ? "Joint winners"
                  : "Winner"
                : "Leading"}
          </p>
          <p className="mt-1 font-[family-name:var(--wire-body)] text-[15px] text-ink">
            {allLevel
              ? `Every card is ${leaders[0].correct} of ${decided}`
              : `${leaders.map((l) => l.name).join(", ")} at ${leaders[0].correct} of ${decided}`}
            {complete
              ? `, with the real total at ${actualTotal?.toFixed(2)}.`
              : `, with ${gameCount - decided} still to play. Live scores are on The Board.`}
            {complete && leaders.length > 1 && (
              <>
                {" "}
                They finished the same distance off it, so the tiebreaker
                cannot separate them and they share the week.
              </>
            )}
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
                    className={`px-3 py-2.5 text-left font-[family-name:var(--wire-display)] text-[14px] font-bold uppercase tracking-[0.02em] ${
                      out.has(row.name) ? "text-ink-faint" : "text-ink"
                    }`}
                  >
                    {row.name}
                    {out.has(row.name) && (
                      <span
                        title="Cannot finish on top however the rest of the week goes"
                        className="ml-2 font-[family-name:var(--wire-mono)] text-[10px] font-normal uppercase tracking-[0.12em] text-ink-faint"
                      >
                        Out
                      </span>
                    )}
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
                        off by {row.tiebreakerDiff.toFixed(2)}
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
              ? `Final \u00B7 ties go to whoever came closest to ${actualTotal?.toFixed(2)}, and stay ties if nobody is closer`
              : `${decided} of ${gameCount} games settled \u00B7 the tiebreaker only counts once every score is final`}
          </p>
        </div>
      </Card>

      <Outlook />
    </Container>
  );
}
