import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { DataCard } from "#/components/ds/app-shell/data-card";
import { EmptyState } from "#/components/ds/app-shell/empty-state";
import type { ListRoomsResponse } from "#/server/api/haxfootball";
import { AdminRoomsTableContent } from "./admin-rooms-table-content";
import { RoomHistoryDialog } from "./room-history-dialog";

export function AdminRoomsTable({ rooms, history }: { rooms: Room[]; history: ListRoomsResponse }) {
  if (rooms.length === 0) {
    return (
      <DataCard title="Salas abertas" meta={<RoomHistoryDialog rooms={history} />}>
        <EmptyState title="Nenhuma sala aberta" />
      </DataCard>
    );
  }

  return (
    <DataCard title="Salas abertas" meta={<RoomHistoryDialog rooms={history} />}>
      <AdminRoomsTableContent rooms={rooms} />
    </DataCard>
  );
}
