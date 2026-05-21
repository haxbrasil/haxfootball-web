import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { useNavigate } from "@tanstack/react-router";
import { DataCard, EmptyState } from "#/components/ds/app-shell";
import { ResourceTable } from "#/components/ds/resource-table";
import { StatusBadge } from "#/components/ds/status-badge";
import { useCloseRoomAction } from "../hooks/use-close-room-action";
import { RoomActions } from "./room-actions";

export function AdminRoomsTable({ rooms }: { rooms: Room[] }) {
  const navigate = useNavigate();
  const { close, closingId } = useCloseRoomAction();

  if (rooms.length === 0) {
    return <EmptyState title="Nenhuma sala encontrada" />;
  }

  return (
    <DataCard title="Salas atuais">
      <ResourceTable
        rows={rooms}
        columns={[
          {
            key: "program",
            title: "Programa",
            cell: (room) => room.program?.title ?? room.program?.name ?? room.id,
          },
          {
            key: "state",
            title: "Estado",
            cell: (room) => <StatusBadge value={room.state} />,
          },
          {
            key: "version",
            title: "Versão",
            cell: (room) => room.version?.version ?? "-",
          },
          {
            key: "actions",
            title: "",
            cell: (room) => (
              <RoomActions
                room={room}
                isClosing={closingId === room.id}
                onClose={close}
                onOpenDetails={(roomId) => navigate({ to: "/rooms/$roomId", params: { roomId } })}
              />
            ),
          },
        ]}
      />
    </DataCard>
  );
}
