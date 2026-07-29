import { createFileRoute } from "@tanstack/react-router";
import { PubsPage } from "#/features/pubs/page";
import { countMatchesFn, getStatsCategoryRankingsFn, listMatchesFn } from "#/server/api/functions";

export const Route = createFileRoute("/pubs/")({
  loader: async () => {
    const [matches, matchCount, rankings] = await Promise.all([
      listMatchesFn({ data: { limit: 5 } }),
      countMatchesFn(),
      getStatsCategoryRankingsFn(),
    ]);

    return { matches, matchCount, rankings };
  },
  component: () => {
    const data = Route.useLoaderData();

    return (
      <PubsPage matches={data.matches} matchCount={data.matchCount} rankings={data.rankings} />
    );
  },
});
