import { Check, Download, Film, Focus, LoaderCircle, Monitor, Smartphone } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import {
  createClipExportFn,
  getClipExportCapabilitiesFn,
  listClipExportsFn,
} from "#/server/api/functions";
import type {
  ClipExport,
  ClipExportCapabilities,
  ClipExportFormat,
  ClipExportOrientation,
  ClipExportProfile,
  ClipExportScoreboard,
} from "#/server/api/haxfootball";
import { cn } from "#/lib/utils";

const formats: Array<{ value: ClipExportFormat; title: string; body: string }> = [
  { value: "mp4", title: "MP4", body: "Compatível com a maioria dos destinos." },
  { value: "webm", title: "WebM", body: "Vídeo leve para a web." },
  { value: "gif", title: "GIF", body: "Animação sem áudio para compartilhar." },
];
const orientations: Array<{
  value: ClipExportOrientation;
  title: string;
  body: string;
  icon: typeof Monitor;
}> = [
  { value: "landscape", title: "Horizontal", body: "1280 × 720", icon: Monitor },
  { value: "vertical", title: "Vertical", body: "1080 × 1920", icon: Smartphone },
];
const scoreboards: Array<{ value: ClipExportScoreboard; title: string }> = [
  { value: "default", title: "Padrão" },
  { value: "compact", title: "Compacto" },
  { value: "score-only", title: "Só placar" },
  { value: "time-only", title: "Só tempo" },
  { value: "floating-default", title: "Flutuante" },
  { value: "floating-compact", title: "Flutuante compacto" },
  { value: "floating-score-only", title: "Flutuante: placar" },
  { value: "floating-time-only", title: "Flutuante: tempo" },
  { value: "floating-score-time-right", title: "Flutuante à direita" },
  { value: "none", title: "Ocultar" },
];

export function ClipExportDialog({ clipId }: { clipId: string }) {
  const createExport = useServerFn(createClipExportFn);
  const listExports = useServerFn(listClipExportsFn);
  const getCapabilities = useServerFn(getClipExportCapabilitiesFn);
  const [open, setOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<ClipExportCapabilities | null>(null);
  const [exports, setExports] = useState<ClipExport[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<ClipExportProfile>({
    format: "mp4",
    orientation: "landscape",
    scoreboard: "default",
    cameraId: "",
    renderProfileVersionId: "",
  });

  useEffect(() => {
    if (!open) return;
    let active = true;
    const refresh = async () => {
      const [nextCapabilities, nextExports] = await Promise.all([
        getCapabilities({ data: { id: clipId } }),
        listExports({ data: { id: clipId } }),
      ]);
      if (!active) return;
      setCapabilities(nextCapabilities);
      setExports(nextExports);
      setProfile((current) => {
        const selected = nextCapabilities?.renderProfiles.find(
          (candidate) => candidate.id === current.renderProfileVersionId,
        );
        const fallback = selected ?? nextCapabilities?.renderProfiles[0];
        if (!fallback) return current;
        return {
          ...current,
          renderProfileVersionId: fallback.id,
          format: fallback.formats.includes(current.format) ? current.format : fallback.formats[0],
          orientation: fallback.orientations.includes(current.orientation)
            ? current.orientation
            : fallback.orientations[0],
          scoreboard: fallback.scoreboards.includes(current.scoreboard)
            ? current.scoreboard
            : fallback.scoreboards[0],
          cameraId: fallback.cameras.some((camera) => camera.id === current.cameraId)
            ? current.cameraId
            : (fallback.cameras[0]?.id ?? ""),
        };
      });
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 3_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [clipId, getCapabilities, listExports, open]);

  const selectedRenderProfile = capabilities?.renderProfiles.find(
    (candidate) => candidate.id === profile.renderProfileVersionId,
  );
  const allowed = (value: string, list: readonly string[]) => !capabilities || list.includes(value);
  const queued = exports.some((item) => item.status === "queued" || item.status === "running");

  async function submit() {
    setSubmitting(true);
    try {
      const result = await createExport({ data: { id: clipId, ...profile } });
      if (!result.ok) return toast.error(result.message);
      setExports((current) => [
        result.export,
        ...current.filter((item) => item.id !== result.export.id),
      ]);
      toast.success(
        result.export.status === "ready" ? "Exportação pronta." : "Exportação adicionada à fila.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível preparar a exportação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" />
          Exportar clipe
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(90dvh,52rem)] overflow-y-auto p-0 sm:max-w-3xl"
        showCloseButton
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Film className="size-5 text-primary" /> Exportar clipe
          </DialogTitle>
          <DialogDescription>
            Monte uma versão para compartilhar. O arquivo fica disponível por 24 horas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-7 px-6 py-6">
          <ExportChoiceGroup title="Formato">
            {formats.map((option) => (
              <ChoiceCard
                key={option.value}
                selected={profile.format === option.value}
                disabled={!allowed(option.value, selectedRenderProfile?.formats ?? [])}
                onClick={() => setProfile((current) => ({ ...current, format: option.value }))}
              >
                <strong>{option.title}</strong>
                <span>{option.body}</span>
              </ChoiceCard>
            ))}
          </ExportChoiceGroup>
          <ExportChoiceGroup title="Orientação">
            {orientations.map((option) => {
              const Icon = option.icon;
              return (
                <ChoiceCard
                  key={option.value}
                  selected={profile.orientation === option.value}
                  disabled={!allowed(option.value, selectedRenderProfile?.orientations ?? [])}
                  onClick={() =>
                    setProfile((current) => ({ ...current, orientation: option.value }))
                  }
                >
                  <Icon className="size-5 text-primary" />
                  <strong>{option.title}</strong>
                  <span>{option.body}</span>
                </ChoiceCard>
              );
            })}
          </ExportChoiceGroup>
          <ExportChoiceGroup title="Perfil de exportação">
            {(capabilities?.renderProfiles ?? []).map((option) => (
              <ChoiceCard
                key={option.id}
                selected={profile.renderProfileVersionId === option.id}
                disabled={false}
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    renderProfileVersionId: option.id,
                    format: option.formats.includes(current.format)
                      ? current.format
                      : option.formats[0],
                    orientation: option.orientations.includes(current.orientation)
                      ? current.orientation
                      : option.orientations[0],
                    scoreboard: option.scoreboards.includes(current.scoreboard)
                      ? current.scoreboard
                      : option.scoreboards[0],
                    cameraId: option.cameras[0]?.id ?? "",
                  }))
                }
              >
                <Focus className="size-5 text-primary" />
                <strong>{option.title}</strong>
                <span>{option.description ?? `Versão ${option.version}`}</span>
              </ChoiceCard>
            ))}
          </ExportChoiceGroup>
          <ExportChoiceGroup title="Câmera">
            {(selectedRenderProfile?.cameras ?? []).map((camera) => (
              <ChoiceCard
                key={camera.id}
                selected={profile.cameraId === camera.id}
                disabled={false}
                onClick={() => setProfile((current) => ({ ...current, cameraId: camera.id }))}
              >
                <Focus className="size-5 text-primary" />
                <strong>{camera.title}</strong>
                <span>{camera.description ?? "Enquadramento configurado neste perfil."}</span>
              </ChoiceCard>
            ))}
          </ExportChoiceGroup>
          <div>
            <h3 className="text-sm font-semibold">Placar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha como as informações da partida acompanham o vídeo.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scoreboards.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={!allowed(option.value, selectedRenderProfile?.scoreboards ?? [])}
                  onClick={() =>
                    setProfile((current) => ({ ...current, scoreboard: option.value }))
                  }
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                    profile.scoreboard === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary/60 hover:bg-accent",
                  )}
                >
                  {option.title}
                </button>
              ))}
            </div>
          </div>
          <ExportHistory exports={exports} renderProfiles={capabilities?.renderProfiles ?? []} />
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {queued
              ? "A renderização continua em segundo plano."
              : "A preparação pode levar alguns instantes."}
          </span>
          <Button
            onClick={() => void submit()}
            disabled={submitting || !profile.renderProfileVersionId || !profile.cameraId}
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Gerar exportação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportChoiceGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ChoiceCard({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex min-h-24 flex-col items-start justify-center rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]"
          : "bg-card hover:border-primary/60 hover:bg-accent",
      )}
    >
      {selected ? <Check className="absolute right-3 top-3 size-4 text-primary" /> : null}
      {children}
    </button>
  );
}

function ExportHistory({
  exports,
  renderProfiles,
}: {
  exports: ClipExport[];
  renderProfiles: ClipExportCapabilities["renderProfiles"];
}) {
  if (!exports.length) return null;
  return (
    <div className="border-t pt-5">
      <h3 className="text-sm font-semibold">Exportações recentes</h3>
      <div className="mt-3 space-y-2">
        {exports.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
          >
            <div>
              <strong>
                {item.profile.format.toUpperCase()} ·{" "}
                {item.profile.orientation === "vertical" ? "Vertical" : "Horizontal"}
              </strong>
              <p className="mt-0.5 text-muted-foreground">{statusLabel(item.status)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {renderProfiles.find(
                  (profile) => profile.id === item.profile.renderProfileVersionId,
                )?.title ?? "Perfil de exportação registrado"}
              </p>
            </div>
            {item.url ? (
              <Button asChild size="sm">
                <a href={item.url} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Baixar
                </a>
              </Button>
            ) : item.status === "running" || item.status === "queued" ? (
              <LoaderCircle className="size-4 animate-spin text-primary" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status: ClipExport["status"]) {
  return {
    queued: "Na fila",
    running: "Gerando",
    ready: "Pronta",
    failed: "Não foi concluída",
    expired: "Disponibilidade encerrada",
  }[status];
}
