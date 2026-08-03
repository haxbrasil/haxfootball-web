import { ArrowLeft, CalendarDays, Download, Film, Scissors } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyState } from "#/components/ds/app-shell";
import { LeagueHeader } from "#/components/ds/league-header";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { getClipFn } from "#/server/api/functions";
import type { WebClip } from "#/server/api/haxfootball";
import {
  clipSourceLabel,
  formatClipDate,
  formatClipDuration,
  clipTickNumber,
} from "../utils/clip-formatting";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

export function ClipDetailPage({ clip }: { clip: WebClip | null }) {
  const getClip = useServerFn(getClipFn);
  const [currentClip, setCurrentClip] = useState(clip);

  useEffect(() => {
    setCurrentClip(clip);
  }, [clip]);

  useEffect(() => {
    if (!clip || currentClip?.preview.status !== "pending") {
      return;
    }

    const clipId = clip.id;
    let active = true;
    let refreshing = false;

    async function refresh() {
      if (!active || refreshing || document.visibilityState === "hidden") {
        return;
      }

      refreshing = true;
      try {
        const nextClip = await getClip({ data: { id: clipId } });
        if (active && nextClip) {
          setCurrentClip(nextClip);
        }
      } catch {
        // Preserve the exact replay fallback during transient worker/API failures.
      } finally {
        refreshing = false;
      }
    }

    const intervalId = window.setInterval(() => void refresh(), 5_000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [clip, currentClip?.preview.status, getClip]);

  if (!currentClip) {
    return <EmptyState title="Clipe não encontrado" body="Este momento pode ter sido arquivado." />;
  }

  const title = currentClip.title?.trim() || "Momento da partida";
  return (
    <>
      <LeagueHeader
        title={title}
        eyebrow="Replay selecionado"
        description="Um recorte preciso da gravação original, com o placar e a dinâmica da partida preservados."
        action={
          <Button asChild variant="outline">
            <Link to="/clips">
              <ArrowLeft className="size-4" />
              Voltar para clipes
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <Card className="overflow-hidden border-primary/20 bg-card shadow-lg shadow-primary/5">
          <CardHeader className="gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="size-4 text-primary" />
                Prévia do clipe
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatClipDuration(currentClip.startTick, currentClip.endTick)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-inner">
              {currentClip.preview.videoUrl ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={currentClip.preview.posterUrl ?? undefined}
                  src={currentClip.preview.videoUrl}
                  aria-label={title}
                  className="aspect-video w-full bg-black object-contain"
                >
                  <track
                    kind="captions"
                    src="data:text/vtt,WEBVTT%0A%0A"
                    srcLang="pt-BR"
                    label="Sem fala"
                  />
                </video>
              ) : (
                <Suspense
                  fallback={
                    <div className="flex aspect-video items-center justify-center">
                      <Skeleton className="h-full w-full rounded-none" />
                    </div>
                  }
                >
                  <ReplayPlayer
                    source={currentClip.recording.url}
                    frameWindow={{
                      startFrame: clipTickNumber(currentClip.startTick),
                      endFrame: clipTickNumber(currentClip.endTick),
                    }}
                  />
                </Suspense>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <BroadcastPanel eyebrow="Sobre este momento" title="Detalhes do replay">
            <dl className="grid gap-4 text-sm">
              <DetailRow icon={<Film className="size-4" />} label="Origem">
                {clipSourceLabel(currentClip.sourceKind)}
              </DetailRow>
              <DetailRow icon={<CalendarDays className="size-4" />} label="Criado em">
                {formatClipDate(currentClip.createdAt)}
              </DetailRow>
            </dl>
          </BroadcastPanel>

          <BroadcastPanel eyebrow="Arquivo original" title="Replay completo">
            <p className="text-sm leading-6 text-muted-foreground">
              O clipe continua conectado à gravação completa, para você voltar ao contexto sempre
              que quiser.
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <a href={currentClip.recording.url} download>
                <Download className="size-4" />
                Baixar gravação original
              </a>
            </Button>
          </BroadcastPanel>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
