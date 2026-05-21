import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "#/features/home/home-page";
import { listMatchesFn, listPlayersFn, listRoomsFn } from "#/server/api/functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [rooms, matches, players] = await Promise.all([
      listRoomsFn(),
      listMatchesFn(),
      listPlayersFn(),
    ]);

    return { rooms, matches, players };
  },
  component: () => <HomePage {...Route.useLoaderData()} />,
});
