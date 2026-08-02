import { createFileRoute } from "@tanstack/react-router";
import { ClipsPage, ClipsPageSkeleton } from "#/features/clips/list-page";
import { listClipsFn } from "#/server/api/functions";

export const Route = createFileRoute("/clips/")({
  loader: () => listClipsFn({ data: { limit: 36 } }),
  pendingComponent: ClipsPageSkeleton,
  component: () => <ClipsPage clips={Route.useLoaderData()} />,
});
