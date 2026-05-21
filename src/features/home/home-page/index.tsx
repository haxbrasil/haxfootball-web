import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, DoorOpen, UsersRound } from "lucide-react";
import { DataGrid, PageHeader } from "#/components/ds/app-shell";
import { MetricCard } from "#/components/ds/metric-card";
import { Button } from "#/components/ui/button";
import type {
  ListMatchesResponse,
  ListPlayersResponse,
  ListRoomsResponse,
} from "@haxbrasil/haxfootball-api-sdk";

export function HomePage({
  rooms,
  matches,
  players,
}: {
  rooms: ListRoomsResponse;
  matches: ListMatchesResponse;
  players: ListPlayersResponse;
}) {
  return (
    <>
      <PageHeader
        title="BFL"
        description="Painel público de salas, partidas, jogadores e estatísticas do HaxFootball."
        action={
          <Button asChild>
            <Link to="/rooms">
              <DoorOpen className="size-4" />
              Ver salas
            </Link>
          </Button>
        }
      />

      <DataGrid>
        <MetricCard
          label="Salas"
          value={rooms.items.length}
          detail="Salas retornadas pela API agora."
        />
        <MetricCard
          label="Partidas"
          value={matches.items.length}
          detail="Arquivo público disponível."
        />
        <MetricCard
          label="Jogadores"
          value={players.items.length}
          detail="Perfis e vínculo de conta."
        />
      </DataGrid>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Button asChild variant="outline">
          <Link to="/matches">
            <Activity className="size-4" />
            Partidas recentes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/players">
            <UsersRound className="size-4" />
            Jogadores
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/stats">
            <BarChart3 className="size-4" />
            Rankings
          </Link>
        </Button>
      </section>
    </>
  );
}
