import { lazy, Suspense } from "react";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { listAdminRoomProgramResourcesFn } from "#/server/api/admin-room-program-functions";

const AdminRoomProgramsPage = lazy(() =>
  import("#/features/admin/room-programs-page").then((module) => ({
    default: module.AdminRoomProgramsPage,
  })),
);

export const Route = createFileRoute("/admin/room-programs")({
  loader: () => listAdminRoomProgramResourcesFn(),
  component: AdminRoomProgramsRoute,
});

function AdminRoomProgramsRoute() {
  const resources = useLoaderData({ from: "/admin/room-programs" });

  return (
    <Suspense fallback={null}>
      <AdminRoomProgramsPage resources={resources} />
    </Suspense>
  );
}
