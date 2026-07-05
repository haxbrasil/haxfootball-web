import { createFileRoute } from "@tanstack/react-router";
import { AdminAccountsPage } from "#/features/admin/accounts-page";
import { listAdminAccountResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/accounts")({
  loader: () => listAdminAccountResourcesFn(),
  component: () => {
    const data = Route.useLoaderData();

    if (!data?.accounts || !data.roles || !data.session) {
      return null;
    }

    const { accounts, roles, session } = data;

    return <AdminAccountsPage accounts={accounts} roles={roles} session={session} />;
  },
});
