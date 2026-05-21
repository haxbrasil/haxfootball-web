import { createFileRoute } from "@tanstack/react-router";
import { MatchDetailPage } from "#/features/matches/detail-page";
import { getMatchDetailFn } from "#/server/api/functions";

export const Route = createFileRoute("/matches/$matchId")({
  loader: ({ params }) => getMatchDetailFn({ data: { id: params.matchId } }),
  component: () => <MatchDetailPage detail={Route.useLoaderData()} />,
});
