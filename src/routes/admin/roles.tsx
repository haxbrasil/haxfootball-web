import { createFileRoute } from "@tanstack/react-router";
import { AdminRolesPage } from "#/features/admin/roles-page";
import { listAdminRoleResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/roles")({
  loader: () => listAdminRoleResourcesFn(),
  component: () => {
    const { roles, permissions } = Route.useLoaderData();

    return <AdminRolesPage roles={roles} permissions={permissions} />;
  },
});
