import { createFileRoute } from "@tanstack/react-router";
import { PlayersPage } from "#/features/players/list-page";
import { listPlayersFn } from "#/server/api/functions";

export const Route = createFileRoute("/players/")({
  loader: () => listPlayersFn(),
  component: () => <PlayersPage players={Route.useLoaderData()} />,
});
