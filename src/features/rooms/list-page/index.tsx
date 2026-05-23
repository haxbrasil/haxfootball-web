import type { ListRoomsResponse } from "@haxbrasil/haxfootball-api-sdk";
import { DataGrid } from "#/components/ds/app-shell";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { LeagueHeader } from "#/components/ds/league-header";
import { RoomCard } from "./components/room-card";

export function RoomsPage({ rooms }: { rooms: ListRoomsResponse }) {
  return (
    <>
      <LeagueHeader
        title="Salas"
        eyebrow={null}
        showBrand={false}
        description="Salas públicas disponíveis para acompanhar ou entrar."
      />
      {rooms.items.length === 0 ? (
        <EmptyLeagueState
          title="Nenhuma sala encontrada"
          body="Quando uma sala estiver disponível, o status e o link aparecem aqui."
        />
      ) : (
        <DataGrid>
          {rooms.items.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </DataGrid>
      )}
    </>
  );
}
