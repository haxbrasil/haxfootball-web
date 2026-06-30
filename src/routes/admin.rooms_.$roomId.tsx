import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { RoomDetailPage } from "#/features/rooms/detail-page";
import { getAdminRoomFn } from "#/server/api/admin-room-functions";

export const Route = createFileRoute("/admin/rooms_/$roomId")({
  loader: ({ params }) => getAdminRoomFn({ data: { id: params.roomId } }),
  component: AdminRoomDetailRoute,
});

function AdminRoomDetailRoute() {
  const room = useLoaderData({ from: "/admin/rooms_/$roomId" });

  return <RoomDetailPage room={room} description="Estado operacional, versão e link da sala." />;
}
