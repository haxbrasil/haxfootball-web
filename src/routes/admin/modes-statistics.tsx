import { createFileRoute } from "@tanstack/react-router";
import { ModesStatisticsPage } from "#/features/admin/modes-statistics-page";
import { listStatisticsAdminResourcesFn } from "#/server/api/statistics-admin-functions";

export const Route = createFileRoute("/admin/modes-statistics")({
  loader: () => listStatisticsAdminResourcesFn(),
  component: () => <ModesStatisticsPage resources={Route.useLoaderData() as never} />,
});
