import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChampionshipWorkspacePage,
  type ChampionshipWorkspaceView,
} from "#/features/admin/championships/workspace-page";
import { ChampionshipWorkspacePending } from "#/features/admin/championships/workspace-pending";
import { getChampionshipWorkspaceFn } from "#/server/api/championship-functions";

const workspaceSearch = z.object({
  view: z
    .enum([
      "setup",
      "teams",
      "salary",
      "draft",
      "format",
      "matches",
      "statistics",
      "archive",
      "activity",
    ])
    .catch("setup"),
  inspector: z.boolean().catch(true),
  match: z.string().uuid().optional(),
});

export const Route = createFileRoute("/admin/championships_/$championshipId")({
  validateSearch: workspaceSearch,
  loader: ({ params }) =>
    getChampionshipWorkspaceFn({
      data: { championshipUuid: params.championshipId },
    }),
  pendingComponent: ChampionshipWorkspacePending,
  component: ChampionshipWorkspaceRoute,
});

function ChampionshipWorkspaceRoute() {
  const { data, session } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <ChampionshipWorkspacePage
      data={data}
      session={session}
      view={search.view as ChampionshipWorkspaceView}
      inspector={search.inspector}
      selectedMatchUuid={search.match ?? null}
    />
  );
}
