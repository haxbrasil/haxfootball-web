import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "#/features/admin/overview-page";
import { getAdminOverviewFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminOverviewFn(),
  component: () => {
    const { resources, sections } = Route.useLoaderData();

    return <AdminPage resources={resources} sections={sections} />;
  },
});
