import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipDetailPage } from "#/features/championships/public/championship-detail-page";
import { getPublicChampionshipFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/championships/$slug/")({
  loader: ({ params }) => getPublicChampionshipFn({ data: { slug: params.slug } }),
  component: () => {
    const { data, session } = Route.useLoaderData();

    return <ChampionshipDetailPage data={data} session={session} />;
  },
});
