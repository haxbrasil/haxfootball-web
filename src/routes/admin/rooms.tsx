import { createFileRoute } from "@tanstack/react-router";
import { AdminRoomsPage } from "#/features/admin/rooms-page";
import { listAdminRoomManagementResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/rooms")({
  loader: () => listAdminRoomManagementResourcesFn(),
  component: () => <AdminRoomsPage resources={Route.useLoaderData()} />,
});
