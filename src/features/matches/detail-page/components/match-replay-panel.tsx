import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Clock3, Download, Flag, Loader2, Scissors, Target } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Slider } from "#/components/ui/slider";
import { createClipFn } from "#/server/api/functions";
import type { WebMatch } from "#/server/api/haxfootball";
import { matchRecordingOptions, type MatchRecordingOption } from "../utils/match-recordings";

const ReplayPlayer = lazy(() => import("./replay-player"));

export function MatchReplayPanel({ match }: { match: WebMatch }) {
  const options = useMemo(() => matchRecordingOptions(match), [match]);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");

  useEffect(() => {
    setSelectedId(options[0]?.id ?? "");
  }, [options]);

  if (options.length === 0) {
    return null;
  }

  const selected = options.find((option) => option.id === selectedId) ?? options[0]!;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Replay da partida</CardTitle>
        <ReplayActions options={options} selected={selected} onSelect={setSelectedId} />
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground">
              Carregando replayer…
            </div>
          }
        >
          <ReplayPlayer key={selected.id} source={selected.url} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function ReplayActions({
  options,
  selected,
  onSelect,
}: {
  options: MatchRecordingOption[];
  selected: MatchRecordingOption;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.length > 1 ? (
        <NativeSelect
          aria-label="Tempo da gravação"
          value={selected.id}
          onChange={(event) => onSelect(event.target.value)}
        >
          {options.map((option) => (
            <NativeSelectOption key={option.id} value={option.id}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : null}
      <ClipCreatorDialog recording={selected} />
      <Button asChild size="sm" variant="outline">
        <a href={selected.url} download>
          <Download className="size-4" />
          Baixar .{selected.format ?? "hbr2"}
        </a>
      </Button>
    </div>
  );
}

function ClipCreatorDialog({ recording }: { recording: MatchRecordingOption }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [totalFrames, setTotalFrames] = useState(1);
  const [startTick, setStartTick] = useState(0);
  const [endTick, setEndTick] = useState(1);
  const [currentTick, setCurrentTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setTotalFrames(1);
    setStartTick(0);
    setEndTick(1);
    setCurrentTick(0);
    setSaving(false);
  }, [open, recording.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (startTick >= endTick || endTick > totalFrames) {
      toast.error("Escolha um intervalo válido para o clipe.");
      return;
    }

    setSaving(true);

    try {
      const result = await createClipFn({
        data: {
          recordingId: recording.id,
          startTick,
          endTick,
          title: title.trim() || undefined,
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Clipe criado.");
      setOpen(false);
      await navigate({ to: "/clips/$clipId", params: { clipId: result.clip.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o clipe.");
    } finally {
      setSaving(false);
    }
  }

  function updateRange(value: number[]) {
    const nextStart = Math.max(0, Math.min(value[0] ?? startTick, totalFrames));
    const nextEnd = Math.max(nextStart + 1, Math.min(value[1] ?? endTick, totalFrames));

    setStartTick(nextStart);
    setEndTick(nextEnd);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Scissors className="size-4" />
          Criar clipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Scissors className="size-5" />
            </div>
            <div>
              <DialogTitle>Recortar um momento</DialogTitle>
              <DialogDescription className="mt-1">
                Marque o início e o fim enquanto revê a gravação. O replay completo permanece
                intacto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-inner">
                <Suspense
                  fallback={
                    <div className="flex aspect-video items-center justify-center text-sm text-slate-300">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Preparando a prévia…
                    </div>
                  }
                >
                  <ReplayPlayer
                    source={recording.url}
                    onReady={(info) => {
                      const frames = Math.max(1, info.totalFrames);
                      setTotalFrames(frames);
                      setEndTick(frames);
                    }}
                    onFrameChange={(frame) =>
                      setCurrentTick(Math.max(0, Math.min(frame, totalFrames)))
                    }
                  />
                </Suspense>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Janela selecionada
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatClipTicks(endTick - startTick)} de duração
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-semibold tabular-nums">
                    <Clock3 className="size-4 text-primary" />
                    {formatClipTicks(currentTick)}
                  </div>
                </div>
                <Slider
                  aria-label="Intervalo do clipe"
                  min={0}
                  max={totalFrames}
                  minStepsBetweenThumbs={1}
                  value={[startTick, endTick]}
                  onValueChange={updateRange}
                  disabled={saving}
                />
                <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
                  <span>{formatClipTicks(startTick)}</span>
                  <span>{formatClipTicks(endTick)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <MarkerCard
                  icon={<Target className="size-4" />}
                  label="Início"
                  value={startTick}
                  onMark={() => setStartTick(Math.min(currentTick, endTick - 1))}
                />
                <MarkerCard
                  icon={<Flag className="size-4" />}
                  label="Fim"
                  value={endTick}
                  onMark={() => setEndTick(Math.max(currentTick, startTick + 1))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clip-title">
                  Nome do clipe <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="clip-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: touchdown no último segundo"
                  maxLength={120}
                  disabled={saving}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Um nome curto ajuda a encontrar este momento depois na galeria.
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
                <p className="font-semibold text-foreground">Pronto para guardar</p>
                <p className="mt-1 text-muted-foreground">
                  O clipe vai apontar para esta gravação e poderá ser revisto a qualquer momento.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/10 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || startTick >= endTick || endTick > totalFrames}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Scissors className="size-4" />
              )}
              {saving ? "Salvando…" : "Salvar clipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkerCard({
  icon,
  label,
  value,
  onMark,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  onMark: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold tabular-nums">{formatClipTicks(value)}</p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onMark}>
        Marcar
      </Button>
    </div>
  );
}

function formatClipTicks(ticks: number) {
  const seconds = Math.max(0, ticks) / 60;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
