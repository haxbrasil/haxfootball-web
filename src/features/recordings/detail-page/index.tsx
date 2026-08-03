import { ArrowLeft, CalendarDays, FileVideo, HardDrive, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode } from "react";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { EmptyState } from "#/components/ds/app-shell";
import { LeagueHeader } from "#/components/ds/league-header";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { Recording } from "#/server/api/haxfootball";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

export function RecordingDetailPage({ recording }: { recording: Recording | null }) {
  if (!recording) {
    return <EmptyState title="Gravação não encontrada" body="Este arquivo não está disponível." />;
  }

  return (
    <>
      <LeagueHeader
        title="Gravação completa"
        eyebrow="Arquivo original"
        description="Reproduza a partida completa com a linha do tempo, placar e controles do replay."
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
                <Play className="size-4 text-primary" />
                Replay completo
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Use a linha do tempo para navegar pela partida.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-inner">
              <Suspense
                fallback={
                  <div className="flex aspect-video items-center justify-center">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                }
              >
                <ReplayPlayer source={recording.url} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <BroadcastPanel eyebrow="Detalhes do arquivo" title="Informações da gravação">
          <dl className="grid gap-4 text-sm">
            <DetailRow icon={<FileVideo className="size-4" />} label="Formato">
              {recording.format ? recording.format.toUpperCase() : "Replay"}
            </DetailRow>
            <DetailRow icon={<HardDrive className="size-4" />} label="Tamanho">
              {formatBytes(recording.sizeBytes)}
            </DetailRow>
            {recording.totalFrames !== null ? (
              <DetailRow icon={<Play className="size-4" />} label="Duração">
                {formatFrames(recording.totalFrames)}
              </DetailRow>
            ) : null}
            <DetailRow icon={<CalendarDays className="size-4" />} label="Adicionada em">
              {formatDate(recording.createdAt)}
            </DetailRow>
          </dl>
        </BroadcastPanel>
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

function formatFrames(value: string | number) {
  const seconds = Math.max(0, Math.round(Number(value) / 60));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
