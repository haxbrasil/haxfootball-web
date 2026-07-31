import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipsPage } from "#/features/championships/public/championships-page";
import { listPublicChampionshipsFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/championships/")({
  loader: () => listPublicChampionshipsFn(),
  component: () => <ChampionshipsPage championships={Route.useLoaderData()} />,
});
