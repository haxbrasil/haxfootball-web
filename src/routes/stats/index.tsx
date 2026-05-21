import { createFileRoute } from "@tanstack/react-router";
import { StatsPage } from "#/features/stats/rankings-page";
import { getStatsFn } from "#/server/api/functions";

export const Route = createFileRoute("/stats/")({
  loader: () => getStatsFn(),
  component: () => <StatsPage stats={Route.useLoaderData()} />,
});
