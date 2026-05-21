import { Link } from "@tanstack/react-router";
import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { StatusBadge } from "#/components/ds/status-badge";
import type { PlayerDetail } from "#/server/api/haxfootball";

export function PlayerMatchesTable({ matches }: { matches: PlayerDetail["matches"] }) {
  if (matches.items.length === 0) {
    return <EmptyState title="Nenhuma partida encontrada para este jogador" />;
  }

  return (
    <DataCard title="Partidas">
      <ResourceTable
        rows={matches.items}
        columns={[
          {
            key: "id",
            title: "Partida",
            cell: (match) => (
              <Link
                to="/matches/$matchId"
                params={{ matchId: match.id }}
                className="underline-offset-4 hover:underline"
              >
                {match.id}
              </Link>
            ),
          },
          {
            key: "status",
            title: "Status",
            cell: (match) => <StatusBadge value={match.status} />,
          },
          {
            key: "score",
            title: "Placar",
            cell: (match) => (match.score ? `${match.score.red} x ${match.score.blue}` : "-"),
          },
        ]}
      />
    </DataCard>
  );
}
