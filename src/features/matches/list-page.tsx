import { Link } from "@tanstack/react-router";
import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { StatusBadge } from "#/components/ds/status-badge";

export function MatchesPage({ matches }: { matches: ListMatchesResponse }) {
  return (
    <>
      <PageHeader title="Partidas" description="Arquivo público de partidas e placares." />
      {matches.items.length === 0 ? (
        <EmptyState title="Nenhuma partida encontrada" />
      ) : (
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
                  className="font-medium underline-offset-4 hover:underline"
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
            {
              key: "date",
              title: "Início",
              cell: (match) => match.initiatedAt ?? "-",
            },
          ]}
        />
      )}
    </>
  );
}
