import { DataCard, EmptyState } from "#/components/ds/app-shell";
import type { MatchDetail } from "#/server/api/haxfootball";
import { createMatchTeamGroups } from "../utils/create-match-team-groups";
import { MatchTeamList } from "./match-team-list";

export function MatchTeamsPanel({
  participations,
}: {
  participations: NonNullable<MatchDetail["match"]>["participations"];
}) {
  if (participations.length === 0) {
    return <EmptyState title="Nenhuma entrada registrada" />;
  }

  const teams = createMatchTeamGroups(participations);

  return (
    <DataCard title="Times">
      <div className="grid gap-4 md:grid-cols-2">
        <MatchTeamList title="Vermelho" tone="red" players={teams.red} />
        <MatchTeamList title="Azul" tone="blue" players={teams.blue} />
      </div>
    </DataCard>
  );
}
