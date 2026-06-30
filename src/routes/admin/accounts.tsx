import { createFileRoute } from "@tanstack/react-router";
import { AdminAccountsPage } from "#/features/admin/accounts-page";
import { listAdminAccountResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/accounts")({
  loader: () => listAdminAccountResourcesFn(),
  component: () => {
    const { accounts, roles } = Route.useLoaderData();

    return <AdminAccountsPage accounts={accounts} roles={roles} />;
  },
});
