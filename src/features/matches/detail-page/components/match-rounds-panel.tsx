import { ExternalLink } from "lucide-react";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { Scoreline } from "#/components/ds/scoreline";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { matchRoundLabel } from "#/lib/matches/composition-rounds";
import type { MatchDetail, WebComposedMatch } from "#/server/api/haxfootball";
import { createHaxBallReplayUrl } from "../utils/haxball-replay-url";
import { MatchMetricsTable } from "./match-metrics-table";

export function MatchRoundsPanel({
  match,
  detail,
  omittedMetricKeys,
}: {
  match: WebComposedMatch;
  detail: MatchDetail;
  omittedMetricKeys: string[];
}) {
  const roundMetrics =
    !detail.metrics || Array.isArray(detail.metrics) ? [] : detail.metrics.rounds;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempos da partida</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {match.rounds.map((round) => {
          const metrics = roundMetrics.find(
            (entry) =>
              entry.round.kind === round.kind &&
              (round.kind === "extra-time" || Number(entry.round.number) === Number(round.number)),
          )?.metrics;

          return (
            <section key={round.matchId} className="grid gap-4 rounded-xl border p-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{matchRoundLabel(round)}</Badge>
                  <MatchStatusBadge value={round.match.status} />
                  <Scoreline red={round.match.score?.red} blue={round.match.score?.blue} compact />
                </div>
                {round.match.recording ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={createHaxBallReplayUrl(round.match.recording.url)}>
                      <ExternalLink className="size-4" />
                      Gravação
                    </a>
                  </Button>
                ) : null}
              </header>

              {metrics ? (
                <MatchMetricsTable
                  metrics={metrics}
                  metricMetadata={detail.metricMetadata}
                  omittedMetricKeys={omittedMetricKeys}
                />
              ) : null}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
