import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import type { MatchDetail } from "#/server/api/haxfootball";

export function MatchEventsTable({
  events,
}: {
  events: NonNullable<MatchDetail["match"]>["events"];
}) {
  if (events.length === 0) {
    return <EmptyState title="Nenhum evento de sala" />;
  }

  return (
    <DataCard title="Eventos de sala">
      <ResourceTable
        rows={events}
        columns={[
          { key: "sequence", title: "#", cell: (event) => event.sequence },
          { key: "type", title: "Evento", cell: (event) => event.type },
          { key: "player", title: "Jogador", cell: (event) => event.player.name },
          { key: "team", title: "Time", cell: (event) => event.team ?? "-" },
        ]}
      />
    </DataCard>
  );
}
