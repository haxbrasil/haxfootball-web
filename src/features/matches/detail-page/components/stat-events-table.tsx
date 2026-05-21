import { Ban } from "lucide-react";
import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { MatchDetail } from "#/server/api/haxfootball";
import { useDisableStatEvent } from "../hooks/use-disable-stat-event";
import { formatStatValue } from "../utils/stat-formatting";

export function StatEventsTable({
  matchId,
  statEvents,
  canModerateStats,
}: {
  matchId: string;
  statEvents: MatchDetail["statEvents"]["items"];
  canModerateStats: boolean;
}) {
  const { disable, pendingId } = useDisableStatEvent(matchId);

  if (statEvents.length === 0) {
    return <EmptyState title="Nenhum evento de stats" />;
  }

  return (
    <DataCard title="Eventos de stats">
      <ResourceTable
        rows={statEvents}
        columns={[
          { key: "sequence", title: "#", cell: (event) => event.sequence },
          {
            key: "player",
            title: "Jogador",
            cell: (event) => event.player.name,
          },
          { key: "type", title: "Tipo", cell: (event) => event.type },
          { key: "value", title: "Valor", cell: (event) => formatStatValue(event.value) },
          {
            key: "status",
            title: "Status",
            cell: (event) =>
              event.disabled ? (
                <Badge variant="secondary">Desabilitado</Badge>
              ) : (
                <Badge>Ativo</Badge>
              ),
          },
          {
            key: "actions",
            title: "",
            cell: (event) =>
              canModerateStats && !event.disabled ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pendingId === event.id}
                  onClick={() => disable(event.id)}
                >
                  <Ban className="size-4" />
                  Desabilitar
                </Button>
              ) : null,
          },
        ]}
      />
    </DataCard>
  );
}
