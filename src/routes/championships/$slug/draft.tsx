import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipDraftEventPage } from "#/features/championships/public/championship-draft-event-page";
import { getPublicChampionshipFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/championships/$slug/draft")({
  loader: ({ params }) => getPublicChampionshipFn({ data: { slug: params.slug } }),
  component: () => {
    const { data, session } = Route.useLoaderData();

    return <ChampionshipDraftEventPage data={data} session={session} />;
  },
});
