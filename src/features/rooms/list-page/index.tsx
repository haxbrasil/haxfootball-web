import type { ListRoomsResponse } from "@haxbrasil/haxfootball-api-sdk";
import { DataGrid, EmptyState, PageHeader } from "#/components/ds/app-shell";
import { RoomCard } from "./components/room-card";

export function RoomsPage({ rooms }: { rooms: ListRoomsResponse }) {
  return (
    <>
      <PageHeader
        title="Salas"
        description="Salas gerenciadas pela API. O companion usa apenas o estado e link disponíveis hoje."
      />
      {rooms.items.length === 0 ? (
        <EmptyState title="Nenhuma sala encontrada" />
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
