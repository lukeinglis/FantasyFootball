import Container from "@/components/Container";
import { Card, CardBody, CardHeader } from "@/components/Card";
import pickemData from "@/data/pickem.json";
import { buildBoard, type PickemData } from "@/lib/pickem";

const data = pickemData as PickemData;
const board = buildBoard(data);

export default function BoardContent() {
  return (
    <Container>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {board.map(({ game, tally, votes, averageTotal, consensus }) => (
          <Card key={game.id} variant="scoreboard">
            <CardHeader
              title={`Game ${game.id}`}
              description={
                votes > 0
                  ? `Avg predicted total ${averageTotal.toFixed(0)}`
                  : "No picks yet"
              }
            />
            <CardBody className="space-y-4">
              {tally.map(({ team, backers }) => {
                const share = votes > 0 ? (backers.length / votes) * 100 : 0;
                const isConsensus = consensus === team.name;
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
                      <span className="flex-shrink-0 font-[family-name:var(--wire-mono)] text-[13px] font-semibold text-ink">
                        {backers.length}
                      </span>
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
                      {backers.length > 0 ? backers.join(", ") : "\u2014"}
                    </p>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        ))}
      </div>
    </Container>
  );
}
