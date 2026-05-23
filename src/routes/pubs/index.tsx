import { createFileRoute } from "@tanstack/react-router";
import { PubsPage } from "#/features/pubs/page";
import { getStatsCategoryRankingsFn, listMatchesFn } from "#/server/api/functions";

export const Route = createFileRoute("/pubs/")({
  loader: async () => {
    const [matches, rankings] = await Promise.all([
      listMatchesFn({ data: { limit: 5 } }),
      getStatsCategoryRankingsFn(),
    ]);

    return { matches, rankings };
  },
  component: () => {
    const data = Route.useLoaderData();

    return <PubsPage matches={data.matches} rankings={data.rankings} />;
  },
});
