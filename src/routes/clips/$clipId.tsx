import { createFileRoute } from "@tanstack/react-router";
import { ClipDetailPage } from "#/features/clips/detail-page";
import { getClipFn } from "#/server/api/functions";

export const Route = createFileRoute("/clips/$clipId")({
  loader: ({ params }) => getClipFn({ data: { id: params.clipId } }),
  component: () => <ClipDetailPage clip={Route.useLoaderData()} />,
});
