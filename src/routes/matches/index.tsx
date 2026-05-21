import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage } from "#/features/matches/list-page";
import { listMatchesFn } from "#/server/api/functions";

export const Route = createFileRoute("/matches/")({
  loader: () => listMatchesFn(),
  component: () => <MatchesPage matches={Route.useLoaderData()} />,
});
