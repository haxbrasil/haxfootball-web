import { createFileRoute } from "@tanstack/react-router";
import { RecordingDetailPage } from "#/features/recordings/detail-page";
import { getRecordingFn } from "#/server/api/functions";

export const Route = createFileRoute("/recordings/$recordingId")({
  loader: ({ params }) => getRecordingFn({ data: { id: params.recordingId } }),
  head: ({ params }) => {
    const title = "Gravação completa | BFL";
    const description =
      "Reproduza a gravação completa de uma partida da Brazilian HaxFootball League.";
    const canonicalUrl = `https://bfl.haxbrasil.com/recordings/${encodeURIComponent(params.recordingId)}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "video.other" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "BFL" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: () => <RecordingDetailPage recording={Route.useLoaderData()} />,
});
