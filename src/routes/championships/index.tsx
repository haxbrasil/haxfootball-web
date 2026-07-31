import { createFileRoute } from "@tanstack/react-router";
import {
  ChampionshipsPage,
  ChampionshipsPageSkeleton,
} from "#/features/championships/public/championships-page";
import { listPublicChampionshipsFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/championships/")({
  loader: () => listPublicChampionshipsFn(),
  pendingComponent: ChampionshipsPageSkeleton,
  component: () => <ChampionshipsPage championships={Route.useLoaderData()} />,
});
