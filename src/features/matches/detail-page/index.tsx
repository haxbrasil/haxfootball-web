import { ExternalLink } from "lucide-react";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { Button } from "#/components/ui/button";
import type { MatchDetail } from "#/server/api/haxfootball";
import { MatchEventsTable } from "./components/match-events-table";
import { MatchMetricsTable } from "./components/match-metrics-table";
import { MatchSummaryCards } from "./components/match-summary-cards";
import { ParticipationsTable } from "./components/participations-table";
import { StatEventsTable } from "./components/stat-events-table";

export { formatStatValue } from "./utils/stat-formatting";

export function MatchDetailPage({ detail }: { detail: MatchDetail }) {
  const { match, metrics, statEvents, canModerateStats } = detail;

  if (!match) {
    return <EmptyState title="Partida não encontrada" />;
  }

  return (
    <>
      <PageHeader
        title={`Partida ${match.id}`}
        description="Eventos, participações, gravação, métricas e eventos de stats."
        action={
          match.recording ? (
            <Button asChild variant="outline">
              <a href={match.recording.url}>
                <ExternalLink className="size-4" />
                Gravação
              </a>
            </Button>
          ) : null
        }
      />

      <MatchSummaryCards detail={detail} />

      <section className="mt-6 grid gap-6">
        <MatchMetricsTable metrics={metrics ?? []} />
        <StatEventsTable
          matchId={match.id}
          statEvents={statEvents.items}
          canModerateStats={canModerateStats}
        />
        <ParticipationsTable participations={match.participations} />
        <MatchEventsTable events={match.events} />
      </section>
    </>
  );
}
