import { createFileRoute } from "@tanstack/react-router";
import { ClipDetailPage } from "#/features/clips/detail-page";
import { getClipFn } from "#/server/api/functions";

export const Route = createFileRoute("/clips/$clipId")({
  loader: ({ params }) => getClipFn({ data: { id: params.clipId } }),
  head: ({ loaderData, params }) => {
    const title = loaderData?.title?.trim() || "Momento da partida";
    const pageTitle = `${title} | BFL`;
    const description = "Veja este momento da Brazilian HaxFootball League e compartilhe a jogada.";
    const canonicalUrl = `https://bfl.haxbrasil.com/clips/${encodeURIComponent(params.clipId)}`;
    const meta = [
      { title: pageTitle },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "video.other" },
      { property: "og:url", content: canonicalUrl },
      { property: "og:site_name", content: "BFL" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    const links = [{ rel: "canonical", href: canonicalUrl }];

    if (loaderData?.preview.posterUrl) {
      meta.push(
        { property: "og:image", content: loaderData.preview.posterUrl },
        { property: "og:image:alt", content: `Prévia: ${title}` },
      );
    }
    if (loaderData?.preview.videoUrl) {
      meta.push(
        { property: "og:video", content: loaderData.preview.videoUrl },
        { property: "og:video:secure_url", content: loaderData.preview.videoUrl },
        { property: "og:video:type", content: "video/mp4" },
        { property: "og:video:width", content: String(loaderData.preview.width ?? 1280) },
        { property: "og:video:height", content: String(loaderData.preview.height ?? 720) },
        {
          property: "og:video:duration",
          content: String(Math.max(1, Math.round((loaderData.preview.durationTicks ?? 0) / 60))),
        },
      );
    }

    return { meta, links };
  },
  component: () => <ClipDetailPage clip={Route.useLoaderData()} />,
});
