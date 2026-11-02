import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import pickemData from "@/data/pickem.json";
import { buildBoard, type PickemData } from "@/lib/pickem";

const data = pickemData as PickemData;
const board = buildBoard(data);

/**
 * How the game stands, in words. A score that is in but not final has to say
 * so, since the picks beside it have not been settled by it yet.
 */
function status(score: (typeof board)[number]["score"]): string | null {
  if (score.scores === null) return null;
  if (!score.final) return "In progress";
  return score.leader === null ? "Final \u00B7 level" : "Final";
}

export default function BoardContent() {
  return (
    <Container>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {board.map(({ game, tally, votes, averageTotal, consensus, score }) => {
          const state = status(score);
          return (
            <Card key={game.id} variant="scoreboard">
              <CardHeader
                title={`Game ${game.id}`}
                description={
                  votes > 0
                    ? `Avg predicted total ${averageTotal.toFixed(0)}`
                    : "No picks yet"
                }
                action={
                  state !== null ? (
                    <span
                      className={`font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] ${
                        score.final ? "text-ink-muted" : "text-result"
                      }`}
                    >
                      {state}
                    </span>
                  ) : undefined
                }
              />
              <CardBody className="space-y-4">
                {tally.map(({ team, backers }, i) => {
                  const share = votes > 0 ? (backers.length / votes) * 100 : 0;
                  const isConsensus = consensus === team.name;
                  const points = score.scores?.[i];
                  const isLeader = score.leader === team.name;
                  return (
                    <div key={team.name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-[family-name:var(--wire-mono)] text-[10px] tracking-[0.1em] text-ink-faint">
                            #{team.seed}
                          </span>{" "}
                          <span
                            className={`font-[family-name:var(--wire-display)] text-[15px] font-bold uppercase tracking-[0.02em] ${
                              isConsensus ? "text-ink" : "text-ink-muted"
                            }`}
                          >
                            {team.name}
                          </span>
                          <span className="ml-2 font-[family-name:var(--wire-mono)] text-[10px] tracking-[0.1em] text-ink-faint">
                            {team.record}
                          </span>
                        </div>
                        {points !== undefined && (
                          <span
                            title={
                              score.final ? "Final score" : "Score so far"
                            }
                            className={`flex-shrink-0 font-[family-name:var(--wire-mono)] text-[15px] font-semibold tabular-nums ${
                              isLeader ? "text-ink" : "text-ink-muted"
                            }`}
                          >
                            {points.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div
                        className="mt-1.5 h-1.5 w-full bg-paper"
                        role="img"
                        aria-label={`${backers.length} of ${votes} picked ${team.name}`}
                      >
                        <div
                          className={`h-full ${isConsensus ? "bg-result" : "bg-ink-faint"}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>

                      <p className="mt-1.5 font-[family-name:var(--wire-body)] text-[13px] leading-[1.45] text-ink-soft">
                        <span className="font-[family-name:var(--wire-mono)] text-[12px] text-ink-muted">
                          {backers.length} picked
                        </span>
                        {backers.length > 0
                          ? ` \u00B7 ${backers.join(", ")}`
                          : ""}
                      </p>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
