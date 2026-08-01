import { EmptyState } from "#/components/ds/app-shell";
import { LeagueHeader } from "#/components/ds/league-header";
import { formatMatchCode } from "#/lib/matches/format-match-code";
import { overallMatchMetricRows } from "#/lib/matches/match-metrics";
import type { MatchDetail } from "#/server/api/haxfootball";
import { MatchMetricsTable } from "./components/match-metrics-table";
import { MatchPointsPanel } from "./components/match-points-panel";
import { MatchReplayPanel } from "./components/match-replay-panel";
import { MatchRoundsPanel } from "./components/match-rounds-panel";
import { MatchTeamsPanel } from "./components/match-teams-panel";
import { VisualizationDashboardView } from "#/features/visualizations/visualization-chart";
import { getMatchPointsMetric } from "./utils/match-points";

export { formatStatValue } from "./utils/stat-formatting";

export function MatchDetailPage({ detail }: { detail: MatchDetail }) {
  const { match, metrics, metricMetadata } = detail;
  const pointsMetric = getMatchPointsMetric(detail);

  if (!match) {
    return <EmptyState title="Partida não encontrada" />;
  }

  return (
    <>
      <LeagueHeader
        title={`Partida ${formatMatchCode(match.id)}`}
        eyebrow={null}
        showBrand={false}
        description="Placar, participação e desempenho registrado para a partida."
      />

      <section className="mt-6 grid gap-6">
        <MatchReplayPanel match={match} />
        <MatchTeamsPanel detail={detail} />
        <MatchPointsPanel detail={detail} />
        {detail.visualizations.items.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Análise da partida</h2>
              <p className="text-sm text-muted-foreground">
                Visualizações derivadas dos dados registrados.
              </p>
            </div>
            <VisualizationDashboardView items={detail.visualizations.items} />
          </section>
        ) : null}
        <MatchMetricsTable
          metrics={overallMatchMetricRows(metrics)}
          metricMetadata={metricMetadata}
          omittedMetricKeys={pointsMetric ? [pointsMetric.key] : []}
        />
        {match.kind === "composed" ? (
          <MatchRoundsPanel
            match={match}
            detail={detail}
            omittedMetricKeys={pointsMetric ? [pointsMetric.key] : []}
          />
        ) : null}
      </section>
    </>
  );
}
