import { createFileRoute } from "@tanstack/react-router";
import { AdminRolesPage } from "#/features/admin/roles-page";
import { listAdminResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/roles")({
  loader: () => listAdminResourcesFn(),
  component: () => {
    const { roles, permissions } = Route.useLoaderData();

    return <AdminRolesPage roles={roles} permissions={permissions} />;
  },
});
