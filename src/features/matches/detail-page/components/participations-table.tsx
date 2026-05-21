import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import type { MatchDetail } from "#/server/api/haxfootball";

export function ParticipationsTable({
  participations,
}: {
  participations: NonNullable<MatchDetail["match"]>["participations"];
}) {
  if (participations.length === 0) {
    return <EmptyState title="Nenhuma participação registrada" />;
  }

  return (
    <DataCard title="Participações">
      <ResourceTable
        rows={participations}
        columns={[
          { key: "player", title: "Jogador", cell: (stint) => stint.player.name },
          { key: "team", title: "Time", cell: (stint) => stint.team },
          {
            key: "joined",
            title: "Entrada",
            cell: (stint) => stint.joinedElapsedSeconds ?? stint.joinedAt ?? "-",
          },
          {
            key: "left",
            title: "Saída",
            cell: (stint) => stint.leftElapsedSeconds ?? stint.leftAt ?? "-",
          },
        ]}
      />
    </DataCard>
  );
}
