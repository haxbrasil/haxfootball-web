import { createFileRoute } from "@tanstack/react-router";
import { RoomDetailPage } from "#/features/rooms/detail-page";
import { getRoomFn } from "#/server/api/functions";

export const Route = createFileRoute("/rooms/$roomId")({
  loader: ({ params }) => getRoomFn({ data: { id: params.roomId } }),
  component: () => <RoomDetailPage room={Route.useLoaderData()} />,
});
