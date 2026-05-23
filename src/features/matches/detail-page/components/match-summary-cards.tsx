import { DataCard } from "#/components/ds/app-shell";
import { Scoreline } from "#/components/ds/scoreline";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import type { MatchDetail } from "#/server/api/haxfootball";

export function MatchSummaryCards({ detail }: { detail: MatchDetail }) {
  const { match } = detail;

  if (!match) {
    return null;
  }

  return (
    <DataCard title="Placar" meta={<MatchStatusBadge value={match.status} />}>
      <Scoreline red={match.score?.red} blue={match.score?.blue} fullWidth />
    </DataCard>
  );
}
