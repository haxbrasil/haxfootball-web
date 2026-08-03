import { ArrowRight, CalendarDays, Film, Scissors, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { LeagueHeader } from "#/components/ds/league-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import type { WebClip, WebListClipsResponse } from "#/server/api/haxfootball";
import { useClipsList } from "../hooks/use-clips-list";
import { ClipPreviewVideo } from "../components/clip-preview-video";
import { clipSourceLabel, formatClipDate, formatClipDuration } from "../utils/clip-formatting";

export function ClipsPage({ clips }: { clips: WebListClipsResponse }) {
  const list = useClipsList(clips);

  return (
    <>
      <LeagueHeader
        title="Clipes"
        eyebrow="Momentos da liga"
        description="Reveja os momentos que merecem replay: rápidos de encontrar, fáceis de compartilhar e sempre ligados à gravação original."
        action={
          <Button asChild variant="secondary">
            <Link to="/matches">
              <Film className="size-4" />
              Encontrar uma partida
            </Link>
          </Button>
        }
      />

      <BroadcastPanel
        eyebrow={`${list.items.length}${list.hasMore ? "+" : ""} momentos`}
        title="Galeria de replays"
        action={
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Sparkles className="size-4 text-primary" />
            <span>Arquivo vivo da BFL</span>
          </div>
        }
      >
        {list.items.length === 0 ? (
          <EmptyLeagueState
            title="Sua galeria começa aqui"
            body="Abra uma partida, escolha um trecho e salve seu primeiro momento para montar a coleção da liga."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.items.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}

        <InfiniteListBoundary
          hasMore={list.hasMore}
          isLoading={list.isLoadingMore}
          itemCount={list.items.length}
          onLoadMore={list.loadMore}
        />
      </BroadcastPanel>
    </>
  );
}

function ClipCard({ clip }: { clip: WebClip }) {
  const title = clip.title?.trim() || "Momento sem título";

  return (
    <Link
      to="/clips/$clipId"
      params={{ clipId: clip.id }}
      className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative isolate aspect-video overflow-hidden bg-muted">
        <ClipPreviewVideo clip={clip} title={title} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-3 pt-10 text-white">
          <span className="text-xs font-semibold text-white/80">Prévia do momento</span>
          <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
            {formatClipDuration(clip.startTick, clip.endTick)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold group-hover:text-primary">{title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scissors className="size-3.5 text-primary" />
            {clipSourceLabel(clip.sourceKind)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <CalendarDays className="size-3.5 shrink-0" />
            {formatClipDate(clip.createdAt)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary transition group-hover:gap-2">
            Abrir <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ClipsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando clipes">
      <Skeleton className="h-36 w-full rounded-xl" />
      <section className="space-y-4 rounded-xl border p-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-[1.45/1] rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
