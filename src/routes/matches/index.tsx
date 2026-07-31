import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage, MatchesPageSkeleton } from "#/features/matches/list-page";
import { listMatchesFn } from "#/server/api/functions";

export const Route = createFileRoute("/matches/")({
  loader: () => listMatchesFn(),
  pendingComponent: MatchesPageSkeleton,
  component: () => <MatchesPage matches={Route.useLoaderData()} />,
});
