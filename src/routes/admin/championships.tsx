import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipAdminIndexPage } from "#/features/admin/championships/index-page";
import { listChampionshipAdminIndexFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/admin/championships")({
  loader: () => listChampionshipAdminIndexFn(),
  component: () => <ChampionshipAdminIndexPage data={Route.useLoaderData()} />,
});
