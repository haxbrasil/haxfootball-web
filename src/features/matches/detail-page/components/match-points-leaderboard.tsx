import { Crown } from "lucide-react";
import type { StatsMetric } from "#/lib/stats-metrics/formatting";
import { cn } from "#/lib/utils";
import { createRankedPointsRows, type MatchPointsRow } from "../utils/match-points";
import { MatchPointsValue } from "./match-points-value";

export function MatchPointsLeaderboard({
  rows,
  pointsMetric,
}: {
  rows: MatchPointsRow[];
  pointsMetric: StatsMetric;
}) {
  const rankedRows = createRankedPointsRows(rows);
  const leaderPoints = getNumericPoints(rankedRows[0]?.points);

  return (
    <ol className="grid gap-3">
      {rankedRows.map((row, index) => {
        const isLeader = index === 0;
        const points = getNumericPoints(row.points);
        const scoreRatio =
          points !== null && leaderPoints !== null && leaderPoints > 0
            ? Math.max(12, Math.min(100, (points / leaderPoints) * 100))
            : null;

        return (
          <li
            key={row.player.id ?? `${row.player.name}-${row.rank}`}
            className={cn(
              "relative overflow-hidden rounded-xl border p-3.5 transition",
              isLeader
                ? "border-accent/45 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent)_20%,transparent),color-mix(in_oklch,var(--card)_94%,black)_48%,color-mix(in_oklch,var(--primary)_18%,transparent))] shadow-[0_18px_52px_color-mix(in_oklch,black_28%,transparent)]"
                : "border-border/70 bg-background/40 hover:border-accent/45 hover:bg-muted/45",
            )}
          >
            {scoreRatio !== null && !isLeader ? (
              <span
                className="pointer-events-none absolute inset-y-0 left-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--accent)_16%,transparent),transparent)]"
                style={{ width: `${scoreRatio}%` }}
              />
            ) : null}

            <span className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg border text-sm font-semibold",
                  isLeader
                    ? "border-accent/50 bg-accent/20 text-accent"
                    : "border-border/80 bg-muted/60 text-muted-foreground",
                )}
              >
                {isLeader ? <Crown className="size-5" /> : row.rank}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate font-medium text-foreground",
                    isLeader && "text-lg font-semibold",
                  )}
                >
                  {row.player.name}
                </span>
                {isLeader ? (
                  <span className="block text-xs text-muted-foreground">
                    #{row.rank} na partida
                  </span>
                ) : null}
              </span>

              <span className="text-right">
                <span
                  className={cn(
                    "block font-semibold leading-none text-foreground tabular-nums",
                    isLeader ? "text-2xl" : "text-base",
                  )}
                >
                  <MatchPointsValue points={row.points} pointsMetric={pointsMetric} />
                </span>
                <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-normal text-muted-foreground">
                  Pontos
                </span>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function getNumericPoints(value: unknown) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}
