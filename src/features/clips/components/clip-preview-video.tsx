import { Film, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WebClip } from "#/server/api/haxfootball";

const MAX_ACTIVE_PREVIEWS = 3;
const activePreviewVideos = new Set<HTMLVideoElement>();

export function ClipPreviewVideo({ clip, title }: { clip: WebClip; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoUrl = clip.preview.videoUrl;
  const posterUrl = clip.preview.posterUrl;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(Boolean(entry?.isIntersecting)),
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || videoFailed || reducedMotion) return;

    if (!nearViewport) {
      video.pause();
      activePreviewVideos.delete(video);
      return;
    }

    const play = async () => {
      activePreviewVideos.add(video);
      while (activePreviewVideos.size > MAX_ACTIVE_PREVIEWS) {
        const oldest = activePreviewVideos.values().next().value as HTMLVideoElement | undefined;
        if (!oldest || oldest === video) break;
        oldest.pause();
        activePreviewVideos.delete(oldest);
      }
      try {
        await video.play();
      } catch {
        // Autoplay can be deferred by the browser until the page is interacted with.
      }
    };
    void play();

    return () => {
      video.pause();
      activePreviewVideos.delete(video);
    };
  }, [nearViewport, reducedMotion, videoFailed, videoUrl]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-muted">
          {clip.preview.status === "pending" ? (
            <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
          ) : (
            <Film className="size-8 text-muted-foreground" />
          )}
        </div>
      )}
      {videoUrl && !videoFailed ? (
        <video
          ref={videoRef}
          src={nearViewport && !reducedMotion ? videoUrl : undefined}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-label={`Prévia em vídeo: ${title}`}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  );
}
