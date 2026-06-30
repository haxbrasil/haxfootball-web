import { lazy, Suspense } from "react";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { listAdminRoomManagementResourcesFn } from "#/server/api/admin-room-functions";

const AdminRoomsPage = lazy(() =>
  import("#/features/admin/rooms-page").then((module) => ({
    default: module.AdminRoomsPage,
  })),
);

export const Route = createFileRoute("/admin/rooms")({
  loader: () => listAdminRoomManagementResourcesFn(),
  component: AdminRoomsRoute,
});

function AdminRoomsRoute() {
  const resources = useLoaderData({ from: "/admin/rooms" });

  return (
    <Suspense fallback={null}>
      <AdminRoomsPage resources={resources} />
    </Suspense>
  );
}
