import { ArrowRight, CalendarDays, Film, Play, Scissors, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { InfiniteListBoundary } from "#/components/ds/infinite-list";
import { LeagueHeader } from "#/components/ds/league-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import type { Clip, ListClipsResponse } from "#/server/api/haxfootball";
import { useClipsList } from "../hooks/use-clips-list";
import {
  clipFormatLabel,
  clipSourceLabel,
  formatClipDate,
  formatClipDuration,
  formatClipRange,
} from "../utils/clip-formatting";

export function ClipsPage({ clips }: { clips: ListClipsResponse }) {
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

function ClipCard({ clip }: { clip: Clip }) {
  const title = clip.title?.trim() || "Momento sem título";

  return (
    <Link
      to="/clips/$clipId"
      params={{ clipId: clip.id }}
      className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative isolate aspect-[1.45/1] overflow-hidden bg-[radial-gradient(circle_at_78%_18%,color-mix(in_oklch,var(--accent)_36%,transparent),transparent_32%),linear-gradient(135deg,color-mix(in_oklch,var(--primary)_28%,var(--card)),var(--card))] p-5">
        <div className="absolute -right-8 -bottom-12 size-40 rounded-full border border-primary/20 bg-primary/10 blur-sm transition duration-300 group-hover:scale-125" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Badge variant="outline" className="border-white/20 bg-black/20 text-white">
            {clipFormatLabel(clip.recording.format)}
          </Badge>
          <div className="grid size-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Play className="ml-0.5 size-4 fill-current" />
          </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/65">
                Janela do replay
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {formatClipRange(clip.startTick, clip.endTick)}
              </p>
            </div>
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              {formatClipDuration(clip.startTick, clip.endTick)}
            </span>
          </div>
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
