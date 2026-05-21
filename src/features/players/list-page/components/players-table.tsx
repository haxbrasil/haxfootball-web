import { Link } from "@tanstack/react-router";
import type { Player } from "@haxbrasil/haxfootball-api-sdk";
import { ResourceTable } from "#/components/ds/resource-table";

export function PlayersTable({ players }: { players: Player[] }) {
  return (
    <ResourceTable
      rows={players}
      columns={[
        {
          key: "name",
          title: "Jogador",
          cell: (player) => (
            <Link
              to="/players/$playerId"
              params={{ playerId: player.id }}
              className="font-medium underline-offset-4 hover:underline"
            >
              {player.name}
            </Link>
          ),
        },
        {
          key: "country",
          title: "País",
          cell: (player) => player.country?.toUpperCase() ?? "-",
        },
        {
          key: "account",
          title: "Conta",
          cell: (player) => player.account?.name ?? "-",
        },
      ]}
    />
  );
}
