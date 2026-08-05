import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipGmWorkspacePage } from "#/features/championships/public/championship-gm-workspace-page";
import { getChampionshipGmWorkspaceFn } from "#/server/api/championship-functions";

export const Route = createFileRoute("/championships/$slug/gm")({
  loader: ({ params }) => getChampionshipGmWorkspaceFn({ data: { slug: params.slug } }),
  component: () => {
    const { data, session, generalManagerTeamIds } = Route.useLoaderData();

    return (
      <ChampionshipGmWorkspacePage
        data={data}
        session={session}
        generalManagerTeamIds={generalManagerTeamIds}
      />
    );
  },
});
