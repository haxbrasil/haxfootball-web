import { ExternalLink } from "lucide-react";
import { EmptyState } from "#/components/ds/app-shell";
import { LeagueHeader } from "#/components/ds/league-header";
import { Button } from "#/components/ui/button";
import { formatMatchCode } from "#/lib/matches/format-match-code";
import type { MatchDetail } from "#/server/api/haxfootball";
import { MatchMetricsTable } from "./components/match-metrics-table";
import { MatchPointsPanel } from "./components/match-points-panel";
import { MatchSummaryCards } from "./components/match-summary-cards";
import { MatchTeamsPanel } from "./components/match-teams-panel";
import { createHaxBallReplayUrl } from "./utils/haxball-replay-url";
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
        action={
          match.recording ? (
            <Button asChild variant="outline">
              <a href={createHaxBallReplayUrl(match.recording.url)}>
                <ExternalLink className="size-4" />
                Gravação
              </a>
            </Button>
          ) : null
        }
      />

      <MatchSummaryCards detail={detail} />

      <section className="mt-6 grid gap-6">
        <MatchPointsPanel detail={detail} />
        <MatchTeamsPanel participations={match.participations} />
        <MatchMetricsTable
          metrics={metrics ?? []}
          metricMetadata={metricMetadata}
          omittedMetricKeys={pointsMetric ? [pointsMetric.key] : []}
        />
      </section>
    </>
  );
}
