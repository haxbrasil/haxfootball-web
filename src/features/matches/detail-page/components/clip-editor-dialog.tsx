import {
  Check,
  CirclePlay,
  Clock3,
  Flag,
  History,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
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
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { createClipFn } from "#/server/api/functions";
import { type MatchRecordingOption } from "../utils/match-recordings";

const ReplayPlayer = lazy(() => import("./replay-player"));
const FRAME_RATE = 60;

export function ClipCreatorDialog({ recording }: { recording: MatchRecordingOption }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [totalFrames, setTotalFrames] = useState(1);
  const [startTick, setStartTick] = useState(0);
  const [endTick, setEndTick] = useState(1);
  const [currentTick, setCurrentTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewWindow, setPreviewWindow] = useState<FrameWindow | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [seekRequest, setSeekRequest] = useState<number | undefined>(undefined);
  const editorStateRef = useRef({ currentTick, endTick, startTick, totalFrames });
  editorStateRef.current = { currentTick, endTick, startTick, totalFrames };

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
    setPreviewWindow(null);
    setPreviewing(false);
    setPreviewKey(0);
    setSeekRequest(undefined);
  }, [open, recording.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const {
        currentTick: playhead,
        endTick: currentEnd,
        startTick: currentStart,
        totalFrames: total,
      } = editorStateRef.current;
      const step = event.shiftKey ? FRAME_RATE : 1;
      if (event.key === "i") {
        event.preventDefault();
        setStartTick(Math.min(playhead, currentEnd - 1));
      } else if (event.key === "o") {
        event.preventDefault();
        setEndTick(Math.max(playhead, currentStart + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentTick((value) => clamp(value - step, 0, total));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentTick((value) => clamp(value + step, 0, total));
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open]);

  const selectionDuration = Math.max(0, endTick - startTick);
  const hasReadyReplay = totalFrames > 1;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (startTick >= endTick || endTick > totalFrames) {
      toast.error("Escolha uma janela válida para o clipe.");
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

  function updateRange(nextStart: number, nextEnd: number) {
    setStartTick(clamp(nextStart, 0, Math.max(0, nextEnd - 1)));
    setEndTick(clamp(nextEnd, Math.min(totalFrames, nextStart + 1), totalFrames));
  }

  function markStart() {
    setStartTick(Math.min(currentTick, endTick - 1));
  }

  function markEnd() {
    setEndTick(Math.max(currentTick, startTick + 1));
  }

  function previewSelection() {
    if (!hasReadyReplay) {
      return;
    }

    setPreviewWindow({ startFrame: startTick, endFrame: endTick });
    setSeekRequest(startTick);
    setPreviewing(true);
    setPreviewKey((value) => value + 1);
  }

  function previewFullReplay() {
    if (!hasReadyReplay) {
      return;
    }

    setPreviewWindow(null);
    setSeekRequest(0);
    setCurrentTick(0);
    setPreviewing(true);
    setPreviewKey((value) => value + 1);
  }

  function stopPreview() {
    setPreviewing(false);
    setPreviewKey((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Scissors className="size-4" />
          Criar clipe
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(94dvh,900px)] max-h-[calc(100dvh-1rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/20 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-start gap-4 pr-8">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Scissors className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl sm:text-2xl">Editor de clipe</DialogTitle>
                <Badge variant="outline" className="gap-1.5">
                  <CirclePlay className="size-3.5" />
                  Recorte preciso
                </Badge>
              </div>
              <DialogDescription className="mt-1 max-w-2xl text-sm leading-6">
                Encontre o instante certo, ajuste a janela na linha do tempo e guarde um momento
                pronto para rever.
              </DialogDescription>
            </div>
            <div className="hidden shrink-0 items-end gap-5 text-right sm:flex">
              <HeaderMeta label="Gravação" value={recording.label} />
              <HeaderMeta label="Formato" value={`.${recording.format ?? "hbr2"}`} />
            </div>
          </div>
        </DialogHeader>

        <form id="clip-editor-form" onSubmit={handleSubmit} className="min-h-0 flex-1">
          <div className="h-full overflow-y-auto">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0 space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Prévia
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Reveja a gravação</h2>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Playhead</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                      {formatClipTicks(currentTick)}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1419] shadow-2xl shadow-black/20">
                  <Suspense
                    fallback={
                      <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Preparando a prévia…
                      </div>
                    }
                  >
                    <ReplayPlayer
                      key={`${recording.id}-${previewKey}`}
                      source={recording.url}
                      autoPlay={previewing}
                      frameWindow={previewWindow ?? undefined}
                      seekFrame={seekRequest}
                      onReady={(info) => {
                        const frames = Math.max(1, info.totalFrames);
                        setTotalFrames(frames);
                        setEndTick((value) => (value <= 1 ? frames : Math.min(value, frames)));
                      }}
                      onFrameChange={(frame) => setCurrentTick(Math.max(0, frame))}
                    />
                  </Suspense>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={previewing ? stopPreview : previewSelection}
                    disabled={!hasReadyReplay || saving}
                  >
                    {previewing ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {previewing ? "Parar prévia" : "Prévia da seleção"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={previewFullReplay}
                    disabled={!hasReadyReplay || saving}
                  >
                    <RotateCcw className="size-4" />
                    Replay completo
                  </Button>
                  <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <Maximize2 className="size-3.5" />
                    Use a tela cheia do player para inspecionar detalhes
                  </span>
                </div>

                <ClipTimeline
                  totalFrames={totalFrames}
                  startFrame={startTick}
                  endFrame={endTick}
                  currentFrame={currentTick}
                  disabled={saving || !hasReadyReplay}
                  onCurrentFrameChange={(frame) => {
                    setCurrentTick(frame);
                    setSeekRequest(frame);
                  }}
                  onRangeChange={updateRange}
                />
              </section>

              <aside className="min-w-0 rounded-2xl border bg-muted/10">
                <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Inspetor
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Janela do clipe</h2>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">
                    {formatClipDuration(selectionDuration)}
                  </Badge>
                </div>

                <div className="space-y-5 p-4">
                  <div className="space-y-2 rounded-xl border bg-background p-3">
                    <TimecodeRow
                      icon={Target}
                      label="Início"
                      value={startTick}
                      onUsePlayhead={markStart}
                      disabled={saving || !hasReadyReplay}
                    />
                    <div className="border-t" />
                    <TimecodeRow
                      icon={Flag}
                      label="Fim"
                      value={endTick}
                      onUsePlayhead={markEnd}
                      disabled={saving || !hasReadyReplay}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clip-title">Nome do clipe</Label>
                    <Input
                      id="clip-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ex.: touchdown no último segundo"
                      maxLength={120}
                      disabled={saving}
                    />
                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                      <span>Opcional</span>
                      <span className="tabular-nums">{title.length}/120</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        <Check className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Pronto para guardar</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {formatClipRange(startTick, endTick)} ·{" "}
                          {formatClipDuration(selectionDuration)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <MetaStat label="Duração total" value={formatClipDuration(totalFrames)} />
                    <MetaStat label="Origem" value={recording.format?.toUpperCase() ?? "HBR2"} />
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <History className="size-3.5 text-primary" />
            A gravação completa continua disponível no replay original.
          </div>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              form="clip-editor-form"
              type="submit"
              disabled={saving || !hasReadyReplay || startTick >= endTick || endTick > totalFrames}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Scissors className="size-4" />
              )}
              {saving ? "Salvando…" : "Salvar clipe"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FrameWindow {
  startFrame: number;
  endFrame: number;
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 max-w-40 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function TimecodeRow({
  icon: Icon,
  label,
  value,
  onUsePlayhead,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onUsePlayhead: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatClipTicks(value)}</p>
      </div>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={onUsePlayhead}
        disabled={disabled}
        aria-label={`Usar playhead como ${label.toLowerCase()}`}
        title={`Usar playhead como ${label.toLowerCase()}`}
      >
        <Clock3 className="size-4" />
      </Button>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ClipTimeline({
  totalFrames,
  startFrame,
  endFrame,
  currentFrame,
  disabled,
  onCurrentFrameChange,
  onRangeChange,
}: {
  totalFrames: number;
  startFrame: number;
  endFrame: number;
  currentFrame: number;
  disabled: boolean;
  onCurrentFrameChange: (frame: number) => void;
  onRangeChange: (startFrame: number, endFrame: number) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"start" | "end" | null>(null);
  const safeTotal = Math.max(1, totalFrames);
  const ticks = useMemo(() => buildTimelineTicks(safeTotal), [safeTotal]);

  function frameAtPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = timelineRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) {
      return 0;
    }

    return clamp(
      Math.round(((event.clientX - bounds.left) / bounds.width) * safeTotal),
      0,
      safeTotal,
    );
  }

  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    onCurrentFrameChange(frameAtPointer(event));
  }

  function beginDrag(side: "start" | "end", event: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragRef.current = side;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const side = dragRef.current;
    if (!side || disabled) {
      return;
    }

    const frame = frameAtPointer(event);
    if (side === "start") {
      onRangeChange(Math.min(frame, endFrame - 1), endFrame);
    } else {
      onRangeChange(startFrame, Math.max(frame, startFrame + 1));
    }
  }

  function endDrag() {
    dragRef.current = null;
  }

  function handleHandleKeyDown(
    side: "start" | "end",
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    const step = event.shiftKey ? FRAME_RATE : 1;
    let nextFrame = side === "start" ? startFrame : endFrame;

    if (event.key === "ArrowLeft") nextFrame -= step;
    else if (event.key === "ArrowRight") nextFrame += step;
    else if (event.key === "Home") nextFrame = 0;
    else if (event.key === "End") nextFrame = safeTotal;
    else return;

    event.preventDefault();
    if (side === "start") onRangeChange(nextFrame, endFrame);
    else onRangeChange(startFrame, nextFrame);
  }

  const selectionLeft = `${(startFrame / safeTotal) * 100}%`;
  const selectionWidth = `${((endFrame - startFrame) / safeTotal) * 100}%`;
  const endLeft = `${(endFrame / safeTotal) * 100}%`;
  const playheadLeft = `${(clamp(currentFrame, 0, safeTotal) / safeTotal) * 100}%`;

  return (
    <section
      className="rounded-2xl border bg-muted/10 p-4 sm:p-5"
      aria-label="Linha do tempo do clipe"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Linha do tempo
          </p>
          <h2 className="mt-1 text-lg font-semibold">Ajuste a janela de corte</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Seleção
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px bg-foreground" />
            Playhead
          </span>
        </div>
      </div>

      <div className="mt-5 px-1">
        <div className="relative h-5 text-[10px] tabular-nums text-muted-foreground">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2"
              style={{ left: `${(tick / safeTotal) * 100}%` }}
            >
              {formatClipTicks(tick)}
            </span>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative h-14 touch-none rounded-xl border bg-background/80 shadow-inner"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(event) => {
            if (event.buttons === 0) endDrag();
          }}
          aria-label="Seleção de intervalo"
        >
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
          <div
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full bg-primary/70 shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
            style={{ left: selectionLeft, width: selectionWidth }}
          />
          <div
            className="pointer-events-none absolute inset-y-2 w-px bg-foreground/90 shadow-[0_0_0_1px_color-mix(in_oklch,var(--background)_60%,transparent)]"
            style={{ left: playheadLeft }}
          />
          <TimelineHandle
            label="Início do clipe"
            value={startFrame}
            max={safeTotal}
            left={selectionLeft}
            disabled={disabled}
            onPointerDown={(event) => beginDrag("start", event)}
            onKeyDown={(event) => handleHandleKeyDown("start", event)}
          />
          <TimelineHandle
            label="Fim do clipe"
            value={endFrame}
            max={safeTotal}
            left={endLeft}
            disabled={disabled}
            onPointerDown={(event) => beginDrag("end", event)}
            onKeyDown={(event) => handleHandleKeyDown("end", event)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {formatClipTicks(startFrame)} — {formatClipTicks(endFrame)}
        </span>
        <span>{formatClipDuration(endFrame - startFrame)} selecionados</span>
      </div>
    </section>
  );
}

function TimelineHandle({
  label,
  value,
  max,
  left,
  disabled,
  onPointerDown,
  onKeyDown,
}: {
  label: string;
  value: number;
  max: number;
  left: string;
  disabled: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="absolute top-1/2 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-primary bg-background text-primary shadow-lg transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      style={{ left }}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={formatClipTicks(value)}
      title={`${label}: ${formatClipTicks(value)}`}
    >
      <span className="h-3 w-1 rounded-full bg-primary" />
    </button>
  );
}

function buildTimelineTicks(totalFrames: number) {
  const step = niceTickStep(totalFrames);
  const ticks = [];
  for (let frame = 0; frame < totalFrames; frame += step) {
    ticks.push(frame);
  }
  if (ticks[ticks.length - 1] !== totalFrames) ticks.push(totalFrames);
  return ticks;
}

function niceTickStep(totalFrames: number) {
  const seconds = totalFrames / FRAME_RATE;
  if (seconds <= 30) return FRAME_RATE * 5;
  if (seconds <= 120) return FRAME_RATE * 15;
  if (seconds <= 600) return FRAME_RATE * 60;
  return FRAME_RATE * 300;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function formatClipTicks(ticks: number) {
  const seconds = Math.max(0, Math.floor(ticks)) / FRAME_RATE;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatClipDuration(ticks: number) {
  const seconds = Math.max(0, Math.floor(ticks)) / FRAME_RATE;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function formatClipRange(startTick: number, endTick: number) {
  return `${formatClipTicks(startTick)} — ${formatClipTicks(endTick)}`;
}
