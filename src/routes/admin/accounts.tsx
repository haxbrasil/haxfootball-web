import { createFileRoute } from "@tanstack/react-router";
import { AdminAccountsPage } from "#/features/admin/accounts-page";
import { listAdminResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/accounts")({
  loader: () => listAdminResourcesFn(),
  component: () => {
    const { accounts, roles } = Route.useLoaderData();

    return <AdminAccountsPage accounts={accounts} roles={roles} />;
  },
});
