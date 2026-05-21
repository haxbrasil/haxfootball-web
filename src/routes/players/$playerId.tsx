import { createFileRoute } from "@tanstack/react-router";
import { PlayerDetailPage } from "#/features/players/detail-page";
import { getPlayerFn } from "#/server/api/functions";

export const Route = createFileRoute("/players/$playerId")({
  loader: ({ params }) => getPlayerFn({ data: { id: params.playerId } }),
  component: () => <PlayerDetailPage detail={Route.useLoaderData()} />,
});
