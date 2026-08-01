import { ChevronDown } from "lucide-react";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { Scoreline } from "#/components/ds/scoreline";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardTitle } from "#/components/ui/card";
import { matchRoundLabel } from "#/lib/matches/composition-rounds";
import type { MatchDetail, WebComposedMatch } from "#/server/api/haxfootball";
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
    <Collapsible asChild>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1">
              <CardTitle>Tempos da partida</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {match.rounds.length === 1
                  ? "1 tempo registrado"
                  : `${match.rounds.length} tempos registrados`}
              </p>
            </div>

            <div className="hidden items-center gap-2 sm:flex" aria-hidden="true">
              {match.rounds.map((round) => (
                <span
                  key={round.matchId}
                  className="inline-flex items-center gap-1.5 border-l pl-2 text-xs text-muted-foreground first:border-l-0 first:pl-0"
                >
                  <span>{matchRoundLabel(round)}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {round.match.score?.red ?? "-"} - {round.match.score?.blue ?? "-"}
                  </span>
                </span>
              ))}
            </div>

            <ChevronDown
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
            <span className="sr-only">Mostrar ou ocultar tempos da partida</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-6 border-t pt-6">
            {match.rounds.map((round) => {
              const metrics = roundMetrics.find(
                (entry) =>
                  entry.round.kind === round.kind &&
                  (round.kind === "extra-time" ||
                    Number(entry.round.number) === Number(round.number)),
              )?.metrics;

              return (
                <section key={round.matchId} className="grid gap-4 rounded-xl border p-4">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{matchRoundLabel(round)}</Badge>
                      <MatchStatusBadge value={round.match.status} />
                      <Scoreline
                        red={round.match.score?.red}
                        blue={round.match.score?.blue}
                        compact
                      />
                    </div>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
