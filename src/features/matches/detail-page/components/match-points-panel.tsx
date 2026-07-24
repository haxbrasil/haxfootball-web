import { Sparkles, Trophy } from "lucide-react";
import type { MatchDetail } from "#/server/api/haxfootball";
import { overallMatchMetricRows } from "#/lib/matches/match-metrics";
import { MatchPointsLeaderboard } from "./match-points-leaderboard";
import { SingleScorerPointsCard } from "./single-scorer-points-card";
import { getMatchPointsMetric, getMatchScoringRows } from "../utils/match-points";

export function MatchPointsPanel({ detail }: { detail: MatchDetail }) {
  const pointsMetric = getMatchPointsMetric(detail);
  const rows = pointsMetric
    ? getMatchScoringRows(overallMatchMetricRows(detail.metrics), pointsMetric.key)
    : [];

  if (!pointsMetric || rows.length === 0) {
    return null;
  }

  return (
    <article className="bfl-panel relative overflow-hidden rounded-xl border border-accent/35 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--accent)_14%,transparent),color-mix(in_oklch,var(--card)_96%,black)_42%,color-mix(in_oklch,var(--primary)_16%,transparent))] p-4 text-card-foreground shadow-[0_18px_58px_color-mix(in_oklch,black_34%,transparent)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:68px_100%,100%_40px]" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent/45 bg-accent/18 text-accent shadow-xs">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-normal text-accent">
              {rows.length === 1 ? "Destaque" : "Ranking"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Pontos</h2>
          </div>
        </div>

        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="size-3.5" />
          {rows.length}
        </span>
      </div>

      {rows.length === 1 ? (
        <SingleScorerPointsCard row={rows[0]!} pointsMetric={pointsMetric} />
      ) : (
        <MatchPointsLeaderboard rows={rows} pointsMetric={pointsMetric} />
      )}
    </article>
  );
}
