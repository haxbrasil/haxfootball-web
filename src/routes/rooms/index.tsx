import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage, RoomsPageSkeleton } from "#/features/rooms/list-page";
import { listRoomsFn } from "#/server/api/functions";

export const Route = createFileRoute("/rooms/")({
  loader: () => listRoomsFn(),
  pendingComponent: RoomsPageSkeleton,
  component: () => <RoomsPage rooms={Route.useLoaderData()} />,
});
