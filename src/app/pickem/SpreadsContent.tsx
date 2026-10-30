import Container from "@/components/Container";
import { Card } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import pickemData from "@/data/pickem.json";
import {
  axisPosition,
  buildBoard,
  buildSpreads,
  type PickemData,
} from "@/lib/pickem";

const data = pickemData as PickemData;
const board = buildBoard(data);
const { spreads, scaleMin, scaleMax } = buildSpreads(data);

const widest = [...spreads].sort(
  (a, b) => b.max - b.min - (a.max - a.min),
)[0];

/** Gridline every 50 points across the shared axis. */
const ticks: number[] = [];
for (let t = scaleMin; t <= scaleMax; t += 50) ticks.push(t);

export default function SpreadsContent() {
  if (data.entries.length === 0) {
    return (
      <Container>
        <EmptyState
          title="No cards in yet"
          description="Predicted totals show up here once managers start submitting."
        />
      </Container>
    );
  }

  return (
    <Container>
      {widest && (
        <div className="mb-6 border-l-2 border-result bg-surface px-4 py-3">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.14em] text-result">
            Widest disagreement
          </p>
          <p className="mt-1 font-[family-name:var(--wire-body)] text-[15px] text-ink">
            Game {widest.game.id} &mdash; {widest.max - widest.min} points
            between {widest.lowest.join(", ")} at {widest.min} and{" "}
            {widest.highest.join(", ")} at {widest.max}
            {board[widest.game.id - 1]?.consensus === null
              ? "."
              : ", on a game the room agrees on."}
          </p>
        </div>
      )}

      <Card variant="scoreboard">
        <div className="px-4 py-5 sm:px-6">
          {/* Axis scale, repeated once at the top rather than per row. */}
          <div className="relative mb-5 ml-0 h-4 sm:ml-28">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2 font-[family-name:var(--wire-mono)] text-[10px] text-ink-faint"
                style={{ left: `${axisPosition(t, scaleMin, scaleMax)}%` }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="space-y-6">
            {spreads.map((spread) => {
              const left = axisPosition(spread.min, scaleMin, scaleMax);
              const right = axisPosition(spread.max, scaleMin, scaleMax);
              const avg = axisPosition(spread.average, scaleMin, scaleMax);

              return (
                <div
                  key={spread.game.id}
                  className="sm:flex sm:items-center sm:gap-4"
                >
                  <div className="mb-2 sm:mb-0 sm:w-24 sm:flex-shrink-0">
                    <p className="font-[family-name:var(--wire-display)] text-[14px] font-extrabold uppercase tracking-[0.04em] text-ink">
                      Game {spread.game.id}
                    </p>
                    <p className="font-[family-name:var(--wire-mono)] text-[10px] tracking-[0.08em] text-ink-faint">
                      {spread.max - spread.min} pt range
                    </p>
                  </div>

                  <div className="relative h-9 flex-1">
                    {/* Track */}
                    <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-rule" />
                    {/* Range between the lowest and highest prediction */}
                    <div
                      className="absolute top-1/2 h-1 -translate-y-1/2 bg-paper"
                      style={{ left: `${left}%`, width: `${right - left}%` }}
                    />
                    {/* Average */}
                    <div
                      className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-result"
                      style={{ left: `${avg}%` }}
                      title={`Average ${spread.average.toFixed(0)}`}
                    />
                    {/* One dot per manager */}
                    {spread.marks.map((mark) => (
                      <div
                        key={mark.name}
                        title={`${mark.name}: ${mark.total}`}
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface bg-ink-soft"
                        style={{
                          left: `${axisPosition(mark.total, scaleMin, scaleMax)}%`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-1 flex gap-4 font-[family-name:var(--wire-mono)] text-[11px] text-ink-muted sm:mt-0 sm:w-40 sm:flex-shrink-0 sm:flex-col sm:gap-0">
                    <span>
                      low {spread.min}{" "}
                      <span className="text-ink-faint">
                        {spread.lowest.join(", ")}
                      </span>
                    </span>
                    <span>
                      high {spread.max}{" "}
                      <span className="text-ink-faint">
                        {spread.highest.join(", ")}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-rule px-4 py-2 sm:px-6">
          <p className="font-[family-name:var(--wire-mono)] text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Each dot is one manager&apos;s predicted combined score
            {" \u00B7 "}
            <span className="text-result">red</span>
            {" is the average \u00B7 all six games share one scale"}
          </p>
        </div>
      </Card>
    </Container>
  );
}
