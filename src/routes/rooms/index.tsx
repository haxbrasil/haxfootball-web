import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "#/features/rooms/list-page";
import { listRoomsFn } from "#/server/api/functions";

export const Route = createFileRoute("/rooms/")({
  loader: () => listRoomsFn(),
  component: () => <RoomsPage rooms={Route.useLoaderData()} />,
});
