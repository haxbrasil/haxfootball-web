import { createFileRoute } from "@tanstack/react-router";
import { HonorsPage } from "#/features/admin/honors-page";
import { getChampionshipHonorCatalogFn } from "#/server/api/championship-honor-functions";

export const Route = createFileRoute("/admin/honors")({
  loader: () => getChampionshipHonorCatalogFn(),
  component: () => <HonorsPage data={Route.useLoaderData().data} />,
});
